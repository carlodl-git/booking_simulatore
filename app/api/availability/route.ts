import { NextRequest, NextResponse } from "next/server"
import { getBookingsForDate } from "@/lib/repo"
import { calculateAvailableSlots, calculateAllOccupiedSlots } from "@/lib/availability"
import { AvailabilityResponse, BlackoutPeriod } from "@/lib/types"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get("date")
    const durationMinutes = searchParams.get("durationMinutes")
    const resourceId = searchParams.get("resourceId") || "trackman-io"

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
    console.log('[API Availability] Richiesta disponibilità per:', { date, duration, resourceId })
    const bookings = await getBookingsForDate(resourceId, date)
    console.log('[API Availability] Bookings recuperati:', bookings.length)
    
    // Per ora blackouts sono vuoti (non ancora implementati in Supabase)
    const blackouts: BlackoutPeriod[] = []

    // Calcola slot disponibili
    const { availableSlots, occupiedSlots } = calculateAvailableSlots(
      date,
      duration,
      bookings,
      blackouts,
      resourceId
    )

    // Calcola tutti gli slot occupati (indipendentemente dalla durata)
    const allOccupiedSlots = calculateAllOccupiedSlots(date, bookings, resourceId)
    console.log('[API Availability] Slot occupati calcolati:', {
      allOccupiedSlots: allOccupiedSlots.length,
      allOccupiedSlotsArray: allOccupiedSlots,
    })

    const response: AvailabilityResponse = {
      date,
      resourceId,
      availableSlots,
      occupiedSlots,
      allOccupiedSlots,
    }

    // Disabilita cache per assicurarsi che i dati siano sempre freschi
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
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
