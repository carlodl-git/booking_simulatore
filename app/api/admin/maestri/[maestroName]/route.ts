import { NextRequest, NextResponse } from "next/server"
import { getMaestroPayments } from "@/lib/repo"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: { maestroName: string } }
) {
  try {
    // Il parametro è l'email del maestro (codificata)
    const maestroEmail = decodeURIComponent(params.maestroName)
    const payments = await getMaestroPayments(maestroEmail)
    
    return NextResponse.json({ payments }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error: unknown) {
    console.error(`Error fetching payments for maestro ${params.maestroName}:`, error)
    return NextResponse.json(
      { error: "Errore nel recupero pagamenti maestro", code: "FETCH_ERROR" },
      { status: 500 }
    )
  }
}

