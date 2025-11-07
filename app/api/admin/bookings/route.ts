import { NextResponse } from "next/server"
import { getAllBookings } from "@/lib/repo"

export async function GET() {
  try {
    const bookings = await getAllBookings(5000)
    
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

