import { NextRequest, NextResponse } from "next/server"
import { updateWeeklyHours } from "@/lib/repo"

// Route admin - non cacheabile ma non necessita force-dynamic
export const revalidate = 0

/**
 * PUT /api/admin/weekly-hours/[id]
 * Aggiorna gli orari settimanali per ID
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    
    // Validazione UUID
    const { isValidUUID } = await import('@/lib/validation')
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: "ID weekly hours non valido" },
        { status: 400 }
      )
    }
    
    const body = await request.json()

    // Validazione formato orari (se specificati)
    if (body.openTime !== undefined && body.openTime !== null) {
      if (!/^\d{2}:\d{2}$/.test(body.openTime)) {
        return NextResponse.json(
          { error: "Formato openTime non valido. Usa HH:mm" },
          { status: 400 }
        )
      }
    }
    
    if (body.closeTime !== undefined && body.closeTime !== null) {
      if (!/^\d{2}:\d{2}$/.test(body.closeTime)) {
        return NextResponse.json(
          { error: "Formato closeTime non valido. Usa HH:mm" },
          { status: 400 }
        )
      }
    }

    // Validazione: se entrambi openTime e closeTime sono specificati, closeTime deve essere > openTime
    if (body.openTime && body.closeTime) {
      const [openHours, openMinutes] = body.openTime.split(":").map(Number)
      const [closeHours, closeMinutes] = body.closeTime.split(":").map(Number)
      const openTotalMinutes = openHours * 60 + openMinutes
      const closeTotalMinutes = closeHours * 60 + closeMinutes

      if (closeTotalMinutes <= openTotalMinutes) {
        return NextResponse.json(
          { error: "closeTime deve essere maggiore di openTime" },
          { status: 400 }
        )
      }
    }

    const weeklyHours = await updateWeeklyHours(id, {
      openTime: body.openTime,
      closeTime: body.closeTime,
      isClosed: body.isClosed,
    })

    return NextResponse.json({ weeklyHours })
  } catch (error: unknown) {
    console.error("Errore nell'aggiornamento weekly hours:", error)
    const message = error instanceof Error ? error.message : "Errore interno del server"
    
    if (message.includes('non trovati')) {
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

