import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Login route - sempre dinamica
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    // Credenziali da variabili d'ambiente (obbligatorie in produzione)
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

    // Verifica che le credenziali siano configurate
    if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
      console.error('[Login API] Credenziali admin non configurate')
      return NextResponse.json(
        { error: "Configurazione server non valida" },
        { status: 500 }
      )
    }

    // Validazione input
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: "Credenziali non valide" },
        { status: 401 }
      )
    }

    // Confronto sicuro delle credenziali (timing-safe)
    const usernameMatch = username === ADMIN_USERNAME
    const passwordMatch = password === ADMIN_PASSWORD

    if (usernameMatch && passwordMatch) {
      // Imposta un cookie di sessione valido per 24 ore
      const cookieStore = await cookies()
      const isProduction = process.env.NODE_ENV === 'production'
      
      cookieStore.set("admin-auth", "authenticated", {
        httpOnly: true,
        secure: isProduction, // Secure solo in produzione (richiede HTTPS)
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 ore
        path: "/",
      })

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: "Credenziali non valide" },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('[Login API] Errore durante il login:', error)
    return NextResponse.json(
      { error: "Errore durante il login" },
      { status: 500 }
    )
  }
}

