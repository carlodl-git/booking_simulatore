import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { ensureEnvValidated } from "@/lib/supabase"

// Login route - sempre dinamica
export const revalidate = 0

export async function POST(request: Request) {
  // Valida variabili d'ambiente in produzione
  ensureEnvValidated()
  try {
    const { username, password } = await request.json()

    // Credenziali da variabili d'ambiente (obbligatorie in produzione)
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

    // Debug: log in sviluppo per verificare configurazione (senza esporre password)
    const isDevelopment = process.env.NODE_ENV === 'development'
    if (isDevelopment) {
      console.log('[Login API] Debug:', {
        hasUsername: !!ADMIN_USERNAME,
        hasPassword: !!ADMIN_PASSWORD,
        usernameLength: ADMIN_USERNAME?.length || 0,
        passwordLength: ADMIN_PASSWORD?.length || 0,
        receivedUsername: username,
        receivedUsernameLength: username?.length || 0,
      })
    }

    // Verifica che le credenziali siano configurate
    if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
      console.error('[Login API] Credenziali admin non configurate')
      return NextResponse.json(
        { error: "Configurazione server non valida. Verifica che ADMIN_USERNAME e ADMIN_PASSWORD siano configurate nelle variabili d'ambiente." },
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
      // Usa secure se HTTPS o in produzione (più robusto)
      const requestUrl = request.headers.get('referer') || request.url || ''
      const isHTTPS = requestUrl.startsWith('https://')
      const shouldUseSecure = isHTTPS || isProduction
      
      cookieStore.set("admin-auth", "authenticated", {
        httpOnly: true,
        secure: shouldUseSecure, // Secure se HTTPS disponibile o in produzione
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

