import { NextRequest, NextResponse } from "next/server"
import { updateBlackout, deleteBlackout } from "@/lib/repo"

// Route admin - non cacheabile ma non necessita force-dynamic
export const revalidate = 0

/**
 * PUT /api/admin/blackouts/[id]
 * Aggiorna un blackout esistente
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const blackoutId = params.id
    
    // Validazione UUID
    const { isValidUUID } = await import('@/lib/validation')
    if (!isValidUUID(blackoutId)) {
      return NextResponse.json(
        { error: "ID blackout non valido" },
        { status: 400 }
      )
    }
    
    const body = await request.json()

    // Validazione formato date (se specificate)
    if (body.startDate && !/^\d{4}-\d{2}-\d{2}$/.test(body.startDate)) {
      return NextResponse.json(
        { error: "Formato startDate non valido. Usa YYYY-MM-DD" },
        { status: 400 }
      )
    }
    if (body.endDate && !/^\d{4}-\d{2}-\d{2}$/.test(body.endDate)) {
      return NextResponse.json(
        { error: "Formato endDate non valido. Usa YYYY-MM-DD" },
        { status: 400 }
      )
    }

    // Validazione formato orari (se specificati)
    if (body.startTime !== undefined && body.startTime !== null && !/^\d{2}:\d{2}$/.test(body.startTime)) {
      return NextResponse.json(
        { error: "Formato startTime non valido. Usa HH:mm" },
        { status: 400 }
      )
    }
    if (body.endTime !== undefined && body.endTime !== null && !/^\d{2}:\d{2}$/.test(body.endTime)) {
      return NextResponse.json(
        { error: "Formato endTime non valido. Usa HH:mm" },
        { status: 400 }
      )
    }

    // Validazione: startTime e endTime devono essere entrambi specificati o entrambi null
    if ((body.startTime && !body.endTime) || (!body.startTime && body.endTime)) {
      return NextResponse.json(
        { error: "startTime e endTime devono essere entrambi specificati o entrambi null" },
        { status: 400 }
      )
    }

    const blackout = await updateBlackout(blackoutId, {
      startDate: body.startDate,
      endDate: body.endDate,
      startTime: body.startTime,
      endTime: body.endTime,
      reason: body.reason,
    })

    return NextResponse.json({ blackout })
  } catch (error: unknown) {
    console.error("Errore nell'aggiornamento blackout:", error)
    const message = error instanceof Error ? error.message : "Errore interno del server"
    
    if (message.includes('non trovato')) {
      return NextResponse.json(
        { error: message },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/blackouts/[id]
 * Elimina un blackout
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const blackoutId = params.id
    
    // Validazione UUID
    const { isValidUUID } = await import('@/lib/validation')
    if (!isValidUUID(blackoutId)) {
      return NextResponse.json(
        { error: "ID blackout non valido" },
        { status: 400 }
      )
    }
    
    await deleteBlackout(blackoutId)

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Errore nell'eliminazione blackout:", error)
    const message = error instanceof Error ? error.message : "Errore interno del server"
    
    if (message.includes('non trovato')) {
      return NextResponse.json(
        { error: message },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}


