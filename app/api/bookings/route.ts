import { NextRequest, NextResponse } from "next/server"
import { upsertCustomer, createBookingTx, getOpeningHoursForDate } from "@/lib/repo"
import { calculateEndTime } from "@/lib/availability"
import { CreateBookingRequest, CreateBookingResponse, BookingError } from "@/lib/types"
import { DateTime } from "luxon"
import { TIMEZONE } from "@/lib/availability"
import { Resend } from "resend"
import { BookingConfirmationEmail, AdminNotificationEmail } from "@/components/email-template"
import { generateCancelToken } from "@/lib/cancel-token"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// Helper per logging solo in sviluppo
const isDevelopment = process.env.NODE_ENV === 'development'
const debugLog = (...args: unknown[]) => {
  if (isDevelopment) {
    console.log(...args)
  }
}

/**
 * Aggiunge un timeout a una Promise
 * @param promise La Promise da eseguire
 * @param timeoutMs Timeout in millisecondi (default: 10000 = 10 secondi)
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 10000
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout dopo ${timeoutMs}ms`)), timeoutMs)
    ),
  ])
}

/**
 * Invia email con retry automatico in caso di errori temporanei
 * @param sendFn Funzione che invia l'email
 * @param maxRetries Numero massimo di tentativi (default: 3)
 * @param initialDelay Delay iniziale in ms (default: 1000)
 * @param timeoutMs Timeout per ogni tentativo in ms (default: 10000)
 */
async function sendEmailWithRetry<T>(
  sendFn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  timeoutMs: number = 10000
): Promise<T> {
  let lastError: unknown
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Aggiungi timeout alla richiesta
      const result = await withTimeout(sendFn(), timeoutMs)
      if (attempt > 1) {
        console.log(`✅ Email inviata con successo al tentativo ${attempt}`)
      }
      return result
    } catch (error: unknown) {
      lastError = error
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // Se è l'ultimo tentativo, logga e rilancia l'errore
      if (attempt === maxRetries) {
        console.error(`❌ Errore invio email dopo ${maxRetries} tentativi:`, {
          error: errorMessage,
          attempts: maxRetries,
        })
        throw error
      }
      
      // Calcola delay con exponential backoff
      const delay = initialDelay * Math.pow(2, attempt - 1)
      
      // Non fare retry per errori di validazione (4xx) - sono errori permanenti
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status?: number }).status
        if (status && status >= 400 && status < 500) {
          console.error(`❌ Errore di validazione (${status}), non faccio retry:`, errorMessage)
          throw error
        }
      }
      
      // Non fare retry per timeout - potrebbe essere un problema di rete persistente
      if (errorMessage.includes('Timeout')) {
        console.warn(`⚠️ Timeout al tentativo ${attempt}, continuo con retry...`)
      } else {
        console.warn(`⚠️ Tentativo ${attempt}/${maxRetries} fallito, retry tra ${delay}ms:`, errorMessage)
      }
      
      // Attendi prima del prossimo tentativo
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  // Non dovrebbe mai arrivare qui, ma TypeScript richiede un return
  throw lastError
}

/**
 * Converte date e time in un timestamp ISO usando Europe/Rome timezone
 * date: YYYY-MM-DD, time: HH:mm
 */
function combineDateAndTime(date: string, time: string): string {
  const dateObj = DateTime.fromISO(date, { zone: TIMEZONE })
  const [hours, minutes] = time.split(":").map(Number)
  const dateTime = dateObj.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 })
  return dateTime.toISO()!
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateBookingRequest = await request.json()

    // Validazione input con controlli di lunghezza
    const { isValidEmail, validateStringLength } = await import('@/lib/validation')
    
    if (!body.customer?.firstName || !body.customer?.lastName || !body.customer?.email) {
      return NextResponse.json(
        { error: "Dati customer incompleti", code: "INVALID_INPUT" } as BookingError,
        { status: 400 }
      )
    }
    
    // Validazione lunghezza campi
    if (!validateStringLength(body.customer.firstName, 2, 100)) {
      return NextResponse.json(
        { error: "Il nome deve essere tra 2 e 100 caratteri", code: "INVALID_INPUT" } as BookingError,
        { status: 400 }
      )
    }
    
    if (!validateStringLength(body.customer.lastName, 2, 100)) {
      return NextResponse.json(
        { error: "Il cognome deve essere tra 2 e 100 caratteri", code: "INVALID_INPUT" } as BookingError,
        { status: 400 }
      )
    }
    
    if (!isValidEmail(body.customer.email)) {
      return NextResponse.json(
        { error: "Email non valida", code: "INVALID_INPUT" } as BookingError,
        { status: 400 }
      )
    }
    
    if (body.customer.phone && !validateStringLength(body.customer.phone, 5, 20)) {
      return NextResponse.json(
        { error: "Il telefono deve essere tra 5 e 20 caratteri", code: "INVALID_INPUT" } as BookingError,
        { status: 400 }
      )
    }

    // Validazione durata minima (60 minuti)
    if (!body.durationMinutes || body.durationMinutes < 60) {
      return NextResponse.json(
        { error: "La durata minima di prenotazione è 60 minuti", code: "INVALID_DURATION" } as BookingError,
        { status: 400 }
      )
    }
    
    // Validazione resourceId se specificato
    const resourceId = body.resourceId || "trackman-io"
    const { isValidResourceId } = await import('@/lib/validation')
    if (!isValidResourceId(resourceId)) {
      return NextResponse.json(
        { error: "resourceId non valido", code: "INVALID_INPUT" } as BookingError,
        { status: 400 }
      )
    }
    
    // Estrai la data e l'orario dalla prenotazione per validare gli orari di apertura
    let bookingDate: string
    let startTimeStr: string
    
    if (body.startsAt) {
      // Formato nuovo: startsAt come timestamp ISO
      const startsAtDateTime = DateTime.fromISO(body.startsAt, { zone: TIMEZONE })
      bookingDate = startsAtDateTime.toISODate()!
      startTimeStr = startsAtDateTime.toFormat('HH:mm')
    } else if (body.date && body.startTime) {
      // Formato legacy: date + startTime
      bookingDate = body.date
      startTimeStr = body.startTime
    } else {
      return NextResponse.json(
        { error: "Dati prenotazione incompleti: fornisci 'startsAt' (timestamp ISO) oppure 'date' + 'startTime'", code: "INVALID_INPUT" } as BookingError,
        { status: 400 }
      )
    }

    // Validazione orari di apertura (tranne per lezione-maestro)
    if (body.activityType !== 'lezione-maestro') {
      const openingHours = await getOpeningHoursForDate(bookingDate, resourceId)
      
      if (!openingHours) {
        return NextResponse.json(
          { error: "Il simulatore è chiuso in questa data", code: "CLOSED" } as BookingError,
          { status: 400 }
        )
      }

      // Calcola l'orario di fine
      const endTimeStr = calculateEndTime(startTimeStr, body.durationMinutes)

      // Confronta in minuti per validare
      const [startHours, startMinutes] = startTimeStr.split(":").map(Number)
      const [endHours, endMinutes] = endTimeStr.split(":").map(Number)
      const [openHours, openMinutes] = openingHours.openTime.split(":").map(Number)
      const [closeHours, closeMinutes] = openingHours.closeTime.split(":").map(Number)

      const startTotalMinutes = startHours * 60 + startMinutes
      const endTotalMinutes = endHours * 60 + endMinutes
      const openTotalMinutes = openHours * 60 + openMinutes
      const closeTotalMinutes = closeHours * 60 + closeMinutes

      // Verifica che la prenotazione sia completamente dentro gli orari di apertura
      if (startTotalMinutes < openTotalMinutes || endTotalMinutes > closeTotalMinutes) {
        return NextResponse.json(
          { error: `La prenotazione deve essere effettuata tra le ${openingHours.openTime} e le ${openingHours.closeTime}`, code: "OUTSIDE_OPENING_HOURS" } as BookingError,
          { status: 400 }
        )
      }
    }

    // Calcola startsAt e endsAt per il database
    let startsAt: string
    let endsAt: string

    if (body.startsAt) {
      // Formato nuovo: startsAt come timestamp ISO
      const startsAtDateTime = DateTime.fromISO(body.startsAt, { zone: TIMEZONE })
      // Salva come UTC nel database
      startsAt = startsAtDateTime.toUTC().toISO()!
      const endsAtDateTime = startsAtDateTime.plus({ minutes: body.durationMinutes })
      endsAt = endsAtDateTime.toUTC().toISO()!
    } else {
      // Formato legacy: date + startTime
      startsAt = combineDateAndTime(body.date!, body.startTime!)
      const endTime = calculateEndTime(body.startTime!, body.durationMinutes)
      endsAt = combineDateAndTime(body.date!, endTime)
    }

    // Upsert customer
    const customer = await upsertCustomer({
      firstName: body.customer.firstName,
      lastName: body.customer.lastName,
      email: body.customer.email,
      phone: body.customer.phone,
      userType: body.customer.userType,
    })

    // Crea booking (il constraint EXCLUDE gestisce gli overlap → 409 se necessario)
    const booking = await createBookingTx({
      resourceId,
      customerId: customer.id,
      startsAt,
      endsAt,
      durationMinutes: body.durationMinutes,
      activityType: body.activityType,
      players: body.players,
      notes: body.notes,
      customerFirstName: body.customer.firstName,
      customerLastName: body.customer.lastName,
      customerPhone: body.customer.phone,
      customerUserType: body.customer.userType,
    })

    const response: CreateBookingResponse = {
      booking,
      customer,
    }

    // Invia email di conferma al cliente e notifica all'admin
    // Solo se Resend è configurato
    if (resend) {
      try {
        // Log sempre per debug (anche in produzione)
        console.log('📧 Tentativo invio email - Resend configurato:', {
          hasApiKey: !!process.env.RESEND_API_KEY,
          apiKeyLength: process.env.RESEND_API_KEY?.length || 0,
          nodeEnv: process.env.NODE_ENV,
        })

        const durationHours = Math.floor(booking.durationMinutes / 60)
        const durationMinutes = booking.durationMinutes % 60
        const durationString = durationMinutes > 0 
          ? `${durationHours}h ${durationMinutes}min` 
          : `${durationHours}h`

        // FORZA l'uso del dominio verificato - NON usare mai onboarding@resend.dev
        // Su Plesk le variabili d'ambiente potrebbero non essere lette correttamente
        const verifiedDomainEmail = 'Montecchia Performance Center <noreply@montecchiaperformancecenter.it>'
        let fromEmail = process.env.RESEND_FROM_EMAIL || verifiedDomainEmail
        
        // SICUREZZA: Se contiene onboarding@resend.dev, forza SEMPRE il dominio verificato
        if (fromEmail.includes('onboarding@resend.dev') || fromEmail.includes('resend.dev')) {
          console.log('⚠️ ATTENZIONE: Trovato dominio resend.dev, forzo uso dominio verificato')
          fromEmail = verifiedDomainEmail
        }
        
        // Assicurati che usi sempre il dominio verificato
        if (!fromEmail.includes('montecchiaperformancecenter.it')) {
          console.log('⚠️ ATTENZIONE: From email non usa dominio verificato, forzo correzione')
          fromEmail = verifiedDomainEmail
        }
        
        console.log('🔍 Configurazione email:', {
          fromEmail,
          customerEmail: customer.email,
        })
        
        // Genera token di cancellazione
        const cancelToken = generateCancelToken(booking.id)
        
        // FORZA sempre l'URL di produzione corretto per le email
        // Questo garantisce che le email abbiano sempre l'URL corretto, indipendentemente
        // dalle variabili d'ambiente o configurazioni
        const PRODUCTION_URL = 'https://booking.montecchiaperformancecenter.it'
        const cancelUrl = `${PRODUCTION_URL}/cancel/${cancelToken}`
        
        // Log per debug (sempre, anche in produzione)
        console.log('🔍 URL di cancellazione generato:', {
          cancelUrl,
          bookingId: booking.id,
        })

        // Email al cliente con retry automatico
        try {
          const emailResult = await sendEmailWithRetry(
            () => resend.emails.send({
              from: fromEmail,
              to: [customer.email],
              subject: '✓ Conferma Prenotazione TrackMan iO - Montecchia Performance Center',
              html: BookingConfirmationEmail({
                firstName: customer.firstName,
                lastName: customer.lastName,
                bookingId: booking.id,
                date: booking.date,
                startTime: booking.startTime,
                endTime: booking.endTime,
                duration: durationString,
                players: booking.players,
                activityType: booking.activityType,
                userType: customer.userType,
                cancelToken,
                cancelUrl,
              }),
            }),
            3, // 3 tentativi
            1000 // 1 secondo di delay iniziale
          )
          console.log('✅ Email cliente inviata con successo:', {
            emailId: emailResult.data?.id,
            to: customer.email,
          })
        } catch (emailError: unknown) {
          // Log dettagliato dell'errore (dopo tutti i retry)
          console.error('❌ Errore invio email cliente (dopo retry):', {
            error: emailError,
            message: emailError instanceof Error ? emailError.message : String(emailError),
            stack: emailError instanceof Error ? emailError.stack : undefined,
            customerEmail: customer.email,
            fromEmail,
          })
        }

        const adminEmail = process.env.ADMIN_EMAIL || 'info@montecchiaperformancecenter.it'
        // Email all'admin con retry automatico
        try {
          const adminEmailResult = await sendEmailWithRetry(
            () => resend.emails.send({
              from: fromEmail,
              to: [adminEmail],
              subject: '📅 Nuova Prenotazione TrackMan iO',
              html: AdminNotificationEmail({
                firstName: customer.firstName,
                lastName: customer.lastName,
                bookingId: booking.id,
                date: booking.date,
                startTime: booking.startTime,
                endTime: booking.endTime,
                duration: durationString,
                players: booking.players,
                activityType: booking.activityType,
                userType: customer.userType,
                email: customer.email,
                phone: customer.phone,
              }),
            }),
            3, // 3 tentativi
            1000 // 1 secondo di delay iniziale
          )
          console.log('✅ Email admin inviata con successo:', {
            emailId: adminEmailResult.data?.id,
            to: adminEmail,
          })
        } catch (emailError: unknown) {
          // Log dettagliato dell'errore (dopo tutti i retry)
          console.error('❌ Errore invio email admin (dopo retry):', {
            error: emailError,
            message: emailError instanceof Error ? emailError.message : String(emailError),
            stack: emailError instanceof Error ? emailError.stack : undefined,
            adminEmail,
            fromEmail,
          })
        }
      } catch (emailError: unknown) {
        // Log l'errore ma non bloccare la risposta
        console.error('❌ Errore nella configurazione email:', {
          error: emailError,
          message: emailError instanceof Error ? emailError.message : String(emailError),
          stack: emailError instanceof Error ? emailError.stack : undefined,
        })
      }
    } else {
      // Log se Resend non è configurato
      console.warn('⚠️ Resend non configurato - email non inviate:', {
        hasApiKey: !!process.env.RESEND_API_KEY,
        nodeEnv: process.env.NODE_ENV,
      })
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error: unknown) {
    console.error("Errore nella creazione prenotazione:", error)

    const httpError =
      typeof error === "object" && error !== null
        ? (error as { code?: string; message?: string })
        : {}
    const message = error instanceof Error ? error.message : httpError.message

    // Gestisci errori di overlap (409)
    if (httpError.code === 'OVERLAP') {
      return NextResponse.json(
        {
          error: message || "La prenotazione si sovrappone con una prenotazione esistente",
          code: "OVERLAP",
        } as BookingError,
        { status: 409 }
      )
    }

    // Gestisci altri errori del database
    if (httpError.code === 'DB_ERROR') {
      return NextResponse.json(
        { error: "Errore database", code: "DB_ERROR" } as BookingError,
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: "Errore interno del server", code: "INTERNAL_ERROR" } as BookingError,
      { status: 500 }
    )
  }
}
