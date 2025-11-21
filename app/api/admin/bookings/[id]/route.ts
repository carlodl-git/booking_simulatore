import { NextRequest, NextResponse } from "next/server"
import { cancelBooking } from "@/lib/repo"
import { BookingError } from "@/lib/types"

// Force dynamic rendering - don't cache this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id
    const body = await request.json()

    // Verifica che il body contenga status=cancelled
    if (body.status !== "cancelled") {
      return NextResponse.json(
        {
          error: "Per cancellare una prenotazione, imposta status='cancelled'",
          code: "INVALID_STATUS",
        } as BookingError,
        { status: 400 }
      )
    }

    // Cancella booking in Supabase
    const booking = await cancelBooking(bookingId)

    return NextResponse.json({ booking })
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

