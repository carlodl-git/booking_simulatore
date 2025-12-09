import { NextRequest, NextResponse } from "next/server"
import { getMaestroSummaries, getTotalMaestroOwed, getTotalMaestroPaid, syncMaestroPayments } from "@/lib/repo"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get("startDate") || undefined
    const endDate = searchParams.get("endDate") || undefined

    const [summaries, totalOwed, totalPaid] = await Promise.all([
      getMaestroSummaries(),
      getTotalMaestroOwed(),
      getTotalMaestroPaid(startDate, endDate),
    ])
    
    return NextResponse.json({ 
      summaries,
      totalOwed,
      totalPaid,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error: unknown) {
    console.error("Error fetching maestro summaries:", error)
    return NextResponse.json(
      { error: "Errore nel recupero riepiloghi maestri", code: "FETCH_ERROR" },
      { status: 500 }
    )
  }
}

// Endpoint POST per forzare la sincronizzazione manuale
export async function POST() {
  try {
    await syncMaestroPayments()
    const [summaries, totalOwed] = await Promise.all([
      getMaestroSummaries(),
      getTotalMaestroOwed(),
    ])
    
    return NextResponse.json({ 
      message: "Sincronizzazione completata",
      summaries,
      totalOwed,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error: unknown) {
    console.error("Error syncing maestro payments:", error)
    return NextResponse.json(
      { error: "Errore nella sincronizzazione pagamenti maestri", code: "SYNC_ERROR" },
      { status: 500 }
    )
  }
}

