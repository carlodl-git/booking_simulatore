import { NextRequest, NextResponse } from "next/server"
import { cancelBooking, getBookingById } from "@/lib/repo"
import { BookingError } from "@/lib/types"
import { validateCancelToken } from "@/lib/cancel-token"
import { DateTime } from "luxon"

/**
 * Endpoint pubblico per cancellare una prenotazione tramite token
 * GET /api/bookings/cancel/[token]
 * 
 * Questo endpoint può essere chiamato direttamente o tramite la pagina /cancel/[token]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token

    // Valida il token e ottieni il bookingId
    let bookingId: string
    try {
      bookingId = validateCancelToken(token)
    } catch (error) {
      return NextResponse.json(
        {
          error: "Token di cancellazione non valido o scaduto",
          code: "INVALID_TOKEN",
        } as BookingError,
        { status: 400 }
      )
    }

    // Verifica che la prenotazione esista e non sia già cancellata
    const existingBooking = await getBookingById(bookingId)
    
    if (existingBooking.status === 'cancelled') {
      return NextResponse.json(
        {
          error: "La prenotazione è già stata cancellata",
          code: "ALREADY_CANCELLED",
          booking: existingBooking,
        } as BookingError & { booking: typeof existingBooking },
        { status: 400 }
      )
    }

    // Verifica che non siano passate più di 24 ore dall'orario della prenotazione (startsAt)
    const startsAt = DateTime.fromISO(existingBooking.startsAt).setZone('Europe/Rome')
    const now = DateTime.now().setZone('Europe/Rome')
    const hoursUntilBooking = startsAt.diff(now, 'hours').hours

    // Se l'orario della prenotazione è già passato o mancano meno di 24 ore, non si può cancellare
    if (hoursUntilBooking < 24) {
      const hoursPassed = -hoursUntilBooking
      return NextResponse.json(
        {
          error: "La prenotazione può essere cancellata solo entro 24 ore prima dell'orario prenotato",
          code: "CANCELLATION_EXPIRED",
          booking: existingBooking,
          hoursUntilBooking: Math.round(hoursUntilBooking * 10) / 10,
          hoursPassed: hoursPassed > 0 ? Math.round(hoursPassed * 10) / 10 : 0,
        } as BookingError & { booking: typeof existingBooking; hoursUntilBooking: number; hoursPassed: number },
        { status: 400 }
      )
    }

    // Cancella la prenotazione
    const booking = await cancelBooking(bookingId)

    return NextResponse.json({
      success: true,
      booking,
      message: "Prenotazione cancellata con successo",
    })
  } catch (error: unknown) {
    console.error("Errore nella cancellazione prenotazione:", error)

    const httpError =
      typeof error === "object" && error !== null
        ? (error as { code?: string; message?: string })
        : {}
    const message = error instanceof Error ? error.message : httpError.message

    // Gestisci 404
    if (httpError.code === 'NOT_FOUND') {
      return NextResponse.json(
        { error: message || "Prenotazione non trovata", code: "NOT_FOUND" } as BookingError,
        { status: 404 }
      )
    }

    // Gestisci errori del database
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

