import { NextRequest, NextResponse } from "next/server"
import { markMaestroPaymentAsPaid, markMaestroPaymentAsUnpaid } from "@/lib/repo"

// Route admin - non cacheabile ma non necessita force-dynamic
export const revalidate = 0

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Validazione UUID
    const { isValidUUID } = await import('@/lib/validation')
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: "ID pagamento non valido", code: "INVALID_ID" },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    const { action } = body // 'paid' or 'unpaid'

    let payment
    if (action === 'paid') {
      payment = await markMaestroPaymentAsPaid(id)
    } else if (action === 'unpaid') {
      payment = await markMaestroPaymentAsUnpaid(id)
    } else {
      return NextResponse.json(
        { error: "Azione non valida. Usa 'paid' o 'unpaid'", code: "INVALID_ACTION" },
        { status: 400 }
      )
    }

    return NextResponse.json(payment, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error: unknown) {
    console.error(`Error updating payment ${params.id}:`, error)
    const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto"
    return NextResponse.json(
      { error: "Errore nell'aggiornamento pagamento", code: "UPDATE_ERROR", details: errorMessage },
      { status: 500 }
    )
  }
}

