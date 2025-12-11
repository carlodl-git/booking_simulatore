import { NextRequest, NextResponse } from "next/server"
import { getAllBookings, getTotalRevenueFromPastBookings } from "@/lib/repo"

// Route admin - sempre dinamica ma con breve cache per ridurre carico
export const dynamic = 'force-dynamic'
export const revalidate = 10

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const includeRevenue = searchParams.get("includeRevenue") === "true"

    // Limite ragionevole per evitare query troppo pesanti
    const [bookings, totalRevenue] = await Promise.all([
      getAllBookings(1000),
      includeRevenue ? getTotalRevenueFromPastBookings() : Promise.resolve(0),
    ])
    
    const response: { bookings: unknown[]; totalRevenue?: number } = { bookings }
    
    if (includeRevenue) {
      response.totalRevenue = totalRevenue
    }
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'private, s-maxage=10, stale-while-revalidate=30',
      },
    })
  } catch (error: unknown) {
    console.error("Error fetching all bookings:", error)
    const enrichedError =
      typeof error === "object" && error !== null
        ? (error as { code?: string; httpStatus?: number })
        : {}

    return NextResponse.json(
      { error: "Errore nel recupero prenotazioni", code: enrichedError.code ?? "FETCH_ERROR" },
      { status: enrichedError.httpStatus ?? 500 }
    )
  }
}

