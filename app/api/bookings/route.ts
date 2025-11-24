import { NextRequest, NextResponse } from "next/server"
import { upsertCustomer, createBookingTx } from "@/lib/repo"
import { calculateEndTime } from "@/lib/availability"
import { CreateBookingRequest, CreateBookingResponse, BookingError } from "@/lib/types"
import { DateTime } from "luxon"
import { TIMEZONE } from "@/lib/availability"
import { Resend } from "resend"
import { BookingConfirmationEmail, AdminNotificationEmail } from "@/components/email-template"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
console.log('Resend inizializzato:', resend ? 'SÌ' : 'NO', 'RESEND_API_KEY presente:', !!process.env.RESEND_API_KEY)

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

    // Validazione input
    if (!body.customer?.firstName || !body.customer?.lastName || !body.customer?.email) {
      return NextResponse.json(
        { error: "Dati customer incompleti", code: "INVALID_INPUT" } as BookingError,
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

    // Supporta sia formato date+startTime che startsAt
    let startsAt: string
    let endsAt: string

    if (body.startsAt) {
      // Formato nuovo: startsAt come timestamp ISO
      // Parser il timestamp e mantieni l'offset originale, poi converti in UTC per il DB
      const startsAtDateTime = DateTime.fromISO(body.startsAt, { zone: TIMEZONE })
      // Salva come UTC nel database
      startsAt = startsAtDateTime.toUTC().toISO()!
      const endsAtDateTime = startsAtDateTime.plus({ minutes: body.durationMinutes })
      endsAt = endsAtDateTime.toUTC().toISO()!
    } else if (body.date && body.startTime) {
      // Formato legacy: date + startTime
      startsAt = combineDateAndTime(body.date, body.startTime)
      const endTime = calculateEndTime(body.startTime, body.durationMinutes)
      endsAt = combineDateAndTime(body.date, endTime)
    } else {
      return NextResponse.json(
        { error: "Dati prenotazione incompleti: fornisci 'startsAt' (timestamp ISO) oppure 'date' + 'startTime'", code: "INVALID_INPUT" } as BookingError,
        { status: 400 }
      )
    }

    const resourceId = body.resourceId || "trackman-io"

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
    console.log('Controllo Resend - resend object:', resend ? 'presente' : 'null')
    console.log('RESEND_API_KEY env var:', process.env.RESEND_API_KEY ? 'presente' : 'NON presente')
    if (resend) {
      console.log('Resend configurato, invio email...')
      try {
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
          console.warn('⚠️ ATTENZIONE: Trovato dominio resend.dev, forzo uso dominio verificato')
          fromEmail = verifiedDomainEmail
        }
        
        // Assicurati che usi sempre il dominio verificato
        if (!fromEmail.includes('montecchiaperformancecenter.it')) {
          console.warn('⚠️ ATTENZIONE: From email non usa dominio verificato, forzo correzione')
          fromEmail = verifiedDomainEmail
        }
        
        console.log('🔍 DEBUG EMAIL CONFIG:')
        console.log('  RESEND_FROM_EMAIL env var:', process.env.RESEND_FROM_EMAIL || 'NON IMPOSTATO (userà default)')
        console.log('  From email che verrà usato:', fromEmail)
        console.log('  Invio email cliente a:', customer.email)
        // Email al cliente
        resend.emails.send({
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
          }),
        }).then(result => {
          console.log('✅ Email cliente inviata con successo:', JSON.stringify(result, null, 2))
        })
          .catch(emailError => {
          console.error('❌ Errore invio email cliente:', emailError)
          console.error('Dettagli errore:', JSON.stringify(emailError, null, 2))
        })

        const adminEmail = process.env.ADMIN_EMAIL || 'info@montecchiaperformancecenter.it'
        console.log('ADMIN_EMAIL env var:', process.env.ADMIN_EMAIL)
        console.log('Invio email admin a:', adminEmail)
        // Email all'admin
        resend.emails.send({
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
        }).then(result => {
          console.log('✅ Email admin inviata con successo:', JSON.stringify(result, null, 2))
        })
        .catch(emailError => {
          console.error('❌ Errore invio email admin:', emailError)
          console.error('Dettagli errore:', JSON.stringify(emailError, null, 2))
        })
      } catch (emailError) {
        // Log l'errore ma non bloccare la risposta
        console.error('❌ Errore nella configurazione email:', emailError)
        console.error('Dettagli errore completo:', JSON.stringify(emailError, null, 2))
        if (emailError instanceof Error) {
          console.error('Stack trace:', emailError.stack)
        }
      }
    } else {
      console.log('Resend NON configurato - salto invio email')
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
