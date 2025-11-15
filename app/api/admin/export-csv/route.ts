import { NextResponse } from "next/server"
import { getAllBookings } from "@/lib/repo"

// Force dynamic rendering - don't cache this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const bookings = await getAllBookings(10000)

    // Headers CSV
    const headers = [
      "ID",
      "Data",
      "Orario Inizio",
      "Orario Fine",
      "Nome",
      "Cognome",
      "Email",
      "Telefono",
      "Tipo Utente",
      "Giocatori",
      "Attività",
      "Durata (min)",
      "Stato",
      "Note",
      "Data Creazione",
      "Ultima Modifica"
    ]

    // Convert bookings to CSV rows
    const rows = bookings.map(booking => {
      const activityTypeMap: Record<string, string> = {
        "9": "9 buche",
        "18": "18 buche",
        "pratica": "Campo Pratica",
        "mini-giochi": "Mini-giochi",
        "lezione-maestro": "Lezione maestro"
      }

      return [
        booking.id || "",
        booking.date || "",
        booking.startTime || "",
        booking.endTime || "",
        booking.customer?.firstName || "",
        booking.customer?.lastName || "",
        booking.customer?.email || "",
        booking.customer?.phone || "",
        booking.customer?.userType === "socio" ? "Socio" : "Esterno",
        booking.players || "",
        activityTypeMap[booking.activityType] || booking.activityType,
        booking.durationMinutes || "",
        booking.status === "confirmed" ? "Confermata" : "Cancellata",
        booking.notes || "",
        booking.createdAt || "",
        booking.updatedAt || ""
      ]
    })

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n")

    // Return CSV as response
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="prenotazioni-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error: unknown) {
    console.error("Error exporting CSV:", error)
    const enrichedError =
      typeof error === "object" && error !== null
        ? (error as { code?: string; httpStatus?: number })
        : {}
    return NextResponse.json(
      { error: "Errore nell'esportazione CSV", code: enrichedError.code ?? "EXPORT_ERROR" },
      { status: enrichedError.httpStatus ?? 500 }
    )
  }
}

