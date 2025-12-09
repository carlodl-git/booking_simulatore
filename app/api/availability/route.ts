import { NextRequest, NextResponse } from "next/server"
import { getBookingsForDate, getBlackoutsForDateRange } from "@/lib/repo"
import { calculateAvailableSlots, calculateAllOccupiedSlots } from "@/lib/availability"
import { AvailabilityResponse, BlackoutPeriod } from "@/lib/types"

// Cache per 30 secondi - i dati di disponibilità cambiano raramente
export const revalidate = 30

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get("date")
    const durationMinutes = searchParams.get("durationMinutes")
    const resourceId = searchParams.get("resourceId") || "trackman-io"
    
    // Validazione resourceId
    const { isValidResourceId } = await import('@/lib/validation')
    if (!isValidResourceId(resourceId)) {
      return NextResponse.json(
        { error: "resourceId non valido" },
        { status: 400 }
      )
    }

    // Validazione parametri
    if (!date) {
      return NextResponse.json(
        { error: "Parametro 'date' è obbligatorio" },
        { status: 400 }
      )
    }

    if (!durationMinutes) {
      return NextResponse.json(
        { error: "Parametro 'durationMinutes' è obbligatorio" },
        { status: 400 }
      )
    }

    const duration = parseInt(durationMinutes, 10)
    if (isNaN(duration) || duration <= 0) {
      return NextResponse.json(
        { error: "Parametro 'durationMinutes' deve essere un numero positivo" },
        { status: 400 }
      )
    }

    // Validazione formato data (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: "Formato data non valido. Usa YYYY-MM-DD" },
        { status: 400 }
      )
    }

    // Verifica che la data non sia nel passato
    const requestedDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (requestedDate < today) {
      return NextResponse.json(
        { error: "Non è possibile prenotare per date nel passato" },
        { status: 400 }
      )
    }

    // Recupera bookings da Supabase per la data specificata
    const bookings = await getBookingsForDate(resourceId, date)
    
    // Recupera blackouts per la data specificata
    const blackouts = await getBlackoutsForDateRange(resourceId, date, date)

    // Calcola slot disponibili
    const { availableSlots, occupiedSlots } = calculateAvailableSlots(
      date,
      duration,
      bookings,
      blackouts,
      resourceId
    )

    // Calcola tutti gli slot occupati (indipendentemente dalla durata)
    // Include sia bookings che blackout
    const allOccupiedSlots = calculateAllOccupiedSlots(date, bookings, resourceId, blackouts)

    const response: AvailabilityResponse = {
      date,
      resourceId,
      availableSlots,
      occupiedSlots,
      allOccupiedSlots,
    }

    // Cache per 30 secondi - sufficiente per evitare richieste eccessive
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch (error: unknown) {
    console.error("Errore nel calcolo disponibilità:", error)

    const enrichedError =
      typeof error === "object" && error !== null
        ? (error as { code?: string })
        : {}

    if (enrichedError.code === 'DB_ERROR') {
      return NextResponse.json(
        { error: "Errore database", code: "DB_ERROR" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    )
  }
}
