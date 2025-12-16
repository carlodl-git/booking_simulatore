import { NextRequest, NextResponse } from "next/server"
import { getMaestroPaymentByBookingId, markMaestroPaymentAsPaid, markMaestroPaymentAsNotDue } from "@/lib/repo"

// Route admin - non cacheabile ma non necessita force-dynamic
export const revalidate = 0

/**
 * GET: Recupera il payment maestro per una prenotazione
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const { bookingId } = params
    
    // Validazione UUID
    const { isValidUUID } = await import('@/lib/validation')
    if (!isValidUUID(bookingId)) {
      return NextResponse.json(
        { error: "ID prenotazione non valido", code: "INVALID_ID" },
        { status: 400 }
      )
    }
    
    const payment = await getMaestroPaymentByBookingId(bookingId)
    
    return NextResponse.json({ payment }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error: unknown) {
    console.error(`Error fetching payment for booking ${params.bookingId}:`, error)
    const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto"
    return NextResponse.json(
      { error: "Errore nel recupero pagamento", code: "FETCH_ERROR", details: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * POST: Esegue azioni sul payment maestro tramite booking_id
 * Body: { action: 'paid' | 'not_due' }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const { bookingId } = params
    
    // Validazione UUID
    const { isValidUUID } = await import('@/lib/validation')
    if (!isValidUUID(bookingId)) {
      return NextResponse.json(
        { error: "ID prenotazione non valido", code: "INVALID_ID" },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    const { action } = body // 'paid' or 'not_due'

    // Recupera il payment per questa prenotazione
    const payment = await getMaestroPaymentByBookingId(bookingId)
    
    if (!payment) {
      return NextResponse.json(
        { error: "Pagamento non trovato per questa prenotazione", code: "NOT_FOUND" },
        { status: 404 }
      )
    }

    let updatedPayment
    if (action === 'paid') {
      updatedPayment = await markMaestroPaymentAsPaid(payment.id)
    } else if (action === 'not_due') {
      updatedPayment = await markMaestroPaymentAsNotDue(payment.id)
    } else {
      return NextResponse.json(
        { error: "Azione non valida. Usa 'paid' o 'not_due'", code: "INVALID_ACTION" },
        { status: 400 }
      )
    }

    return NextResponse.json(updatedPayment, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error: unknown) {
    console.error(`Error updating payment for booking ${params.bookingId}:`, error)
    const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto"
    return NextResponse.json(
      { error: "Errore nell'aggiornamento pagamento", code: "UPDATE_ERROR", details: errorMessage },
      { status: 500 }
    )
  }
}

