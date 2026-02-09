import { NextRequest, NextResponse } from "next/server"
import { cancelBooking, updateBookingAdminNotes } from "@/lib/repo"
import { BookingError } from "@/lib/types"

// Route per modifiche - non cacheabile ma non necessita force-dynamic
export const revalidate = 0

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id
    
    // Validazione UUID
    const { isValidUUID } = await import('@/lib/validation')
    if (!isValidUUID(bookingId)) {
      return NextResponse.json(
        { error: "ID prenotazione non valido", code: "INVALID_ID" } as BookingError,
        { status: 400 }
      )
    }
    
    const body = await request.json()

    // Gestisci cancellazione
    if (body.status === "cancelled") {
      const booking = await cancelBooking(bookingId)
      return NextResponse.json({ booking })
    }

    // Gestisci aggiornamento note admin
    if (body.adminNotes !== undefined) {
      const adminNotes = body.adminNotes === null || body.adminNotes === "" ? null : String(body.adminNotes)
      const booking = await updateBookingAdminNotes(bookingId, adminNotes)
      return NextResponse.json({ booking })
    }

    // Se non è né cancellazione né aggiornamento note, errore
    return NextResponse.json(
      {
        error: "Richiesta non valida. Fornisci 'status: cancelled' o 'adminNotes'",
        code: "INVALID_REQUEST",
      } as BookingError,
      { status: 400 }
    )
  } catch (error: unknown) {
    console.error("Errore nell'aggiornamento prenotazione:", error)

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

