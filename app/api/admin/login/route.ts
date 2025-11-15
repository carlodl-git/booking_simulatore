import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    // Credenziali hardcoded (puoi anche usarle da variabili d'ambiente)
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin"
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Imposta un cookie di sessione valido per 24 ore
      const cookieStore = await cookies()
      cookieStore.set("admin-auth", "authenticated", {
        httpOnly: true,
        secure: false, // Disabilita secure per debug (riabilita in produzione con HTTPS)
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 ore
        path: "/",
      })
      
      console.log('[Login API] Cookie impostato:', "admin-auth", "authenticated")

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: "Credenziali non valide" },
        { status: 401 }
      )
    }
  } catch {
    return NextResponse.json(
      { error: "Errore durante il login" },
      { status: 500 }
    )
  }
}

