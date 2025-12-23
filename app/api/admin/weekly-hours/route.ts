import { NextRequest, NextResponse } from "next/server"
import { getWeeklyHours, upsertWeeklyHours } from "@/lib/repo"

// Route admin - non cacheabile ma non necessita force-dynamic
export const revalidate = 0

/**
 * GET /api/admin/weekly-hours
 * Recupera tutti gli orari settimanali per una risorsa
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const resourceId = searchParams.get("resourceId") || "trackman-io"

    // Validazione resourceId
    const { isValidResourceId } = await import('@/lib/validation')
    if (!isValidResourceId(resourceId)) {
      return NextResponse.json(
        { error: "resourceId non valido" },
        { status: 400 }
      )
    }

    const weeklyHours = await getWeeklyHours(resourceId)
    
    return NextResponse.json({ weeklyHours })
  } catch (error: unknown) {
    console.error("Errore nel recupero weekly hours:", error)
    const message = error instanceof Error ? error.message : "Errore interno del server"
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/weekly-hours
 * Crea o aggiorna gli orari per un giorno della settimana (upsert)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validazione
    if (body.dayOfWeek === undefined || body.dayOfWeek === null) {
      return NextResponse.json(
        { error: "dayOfWeek è obbligatorio" },
        { status: 400 }
      )
    }

    if (typeof body.dayOfWeek !== 'number' || body.dayOfWeek < 0 || body.dayOfWeek > 6) {
      return NextResponse.json(
        { error: "dayOfWeek deve essere un numero tra 0 (domenica) e 6 (sabato)" },
        { status: 400 }
      )
    }

    if (body.isClosed === false || body.isClosed === undefined || body.isClosed === null) {
      // Se non è chiuso, richiedi openTime e closeTime
      if (!body.openTime || !body.closeTime) {
        return NextResponse.json(
          { error: "openTime e closeTime sono obbligatori quando isClosed è false" },
          { status: 400 }
        )
      }

      // Validazione formato orari (HH:mm)
      if (!/^\d{2}:\d{2}$/.test(body.openTime)) {
        return NextResponse.json(
          { error: "Formato openTime non valido. Usa HH:mm" },
          { status: 400 }
        )
      }
      if (!/^\d{2}:\d{2}$/.test(body.closeTime)) {
        return NextResponse.json(
          { error: "Formato closeTime non valido. Usa HH:mm" },
          { status: 400 }
        )
      }

      // Validazione: closeTime deve essere > openTime
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

    // Validazione resourceId se specificato
    const resourceId = body.resourceId || "trackman-io"
    const { isValidResourceId } = await import('@/lib/validation')
    if (!isValidResourceId(resourceId)) {
      return NextResponse.json(
        { error: "resourceId non valido" },
        { status: 400 }
      )
    }

    const weeklyHours = await upsertWeeklyHours({
      resourceId,
      dayOfWeek: body.dayOfWeek,
      openTime: body.openTime || "09:30",
      closeTime: body.closeTime || "23:00",
      isClosed: body.isClosed ?? false,
    })

    return NextResponse.json({ weeklyHours }, { status: 201 })
  } catch (error: unknown) {
    console.error("Errore nella creazione/aggiornamento weekly hours:", error)
    const message = error instanceof Error ? error.message : "Errore interno del server"
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

