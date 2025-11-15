import { NextResponse } from "next/server"
import { getAllBookings } from "@/lib/repo"

// Force dynamic rendering - don't cache this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Log environment variables for debugging (remove in production)
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL?.substring(0, 30) + '...')
    console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    
    const bookings = await getAllBookings(5000)
    console.log('Total bookings fetched:', bookings.length)
    
    return NextResponse.json({ bookings })
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

