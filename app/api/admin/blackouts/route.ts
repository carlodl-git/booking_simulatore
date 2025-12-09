import { NextRequest, NextResponse } from "next/server"
import { getAllBlackouts, createBlackout } from "@/lib/repo"

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/admin/blackouts
 * Recupera tutti i blackout (opzionalmente filtrati per resourceId)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const resourceId = searchParams.get("resourceId") || undefined

    const blackouts = await getAllBlackouts(resourceId)
    
    return NextResponse.json({ blackouts })
  } catch (error: unknown) {
    console.error("Errore nel recupero blackouts:", error)
    const message = error instanceof Error ? error.message : "Errore interno del server"
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/blackouts
 * Crea un nuovo blackout
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validazione
    if (!body.resourceId || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: "resourceId, startDate e endDate sono obbligatori" },
        { status: 400 }
      )
    }

    // Validazione formato date
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(body.startDate) || !dateRegex.test(body.endDate)) {
      return NextResponse.json(
        { error: "Formato date non valido. Usa YYYY-MM-DD" },
        { status: 400 }
      )
    }

    // Validazione: endDate >= startDate
    if (new Date(body.endDate) < new Date(body.startDate)) {
      return NextResponse.json(
        { error: "endDate deve essere >= startDate" },
        { status: 400 }
      )
    }

    // Validazione orari (se specificati, devono essere entrambi)
    if ((body.startTime && !body.endTime) || (!body.startTime && body.endTime)) {
      return NextResponse.json(
        { error: "startTime e endTime devono essere entrambi specificati o entrambi null" },
        { status: 400 }
      )
    }

    // Validazione formato orari (HH:mm)
    if (body.startTime && !/^\d{2}:\d{2}$/.test(body.startTime)) {
      return NextResponse.json(
        { error: "Formato startTime non valido. Usa HH:mm" },
        { status: 400 }
      )
    }
    if (body.endTime && !/^\d{2}:\d{2}$/.test(body.endTime)) {
      return NextResponse.json(
        { error: "Formato endTime non valido. Usa HH:mm" },
        { status: 400 }
      )
    }

    const blackout = await createBlackout({
      resourceId: body.resourceId,
      startDate: body.startDate,
      endDate: body.endDate,
      startTime: body.startTime,
      endTime: body.endTime,
      reason: body.reason,
    })

    return NextResponse.json({ blackout }, { status: 201 })
  } catch (error: unknown) {
    console.error("Errore nella creazione blackout:", error)
    const message = error instanceof Error ? error.message : "Errore interno del server"
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}


