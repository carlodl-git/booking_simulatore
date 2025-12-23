import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  
  // Lista di host admin autorizzati (match esatto per sicurezza)
  // Include anche localhost per sviluppo
  const allowedAdminHosts = [
    'admin.booking.montecchiaperformancecenter.it',
    'localhost:3000',
    'localhost:3001',
    '127.0.0.1:3000',
    '127.0.0.1:3001',
  ]
  
  // Se l'accesso è da un host admin autorizzato
  if (allowedAdminHosts.includes(host)) {
    const pathname = request.nextUrl.pathname
    
    // Se NON è una route admin, lascia passare normalmente (route pubbliche)
    if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin/')) {
      return NextResponse.next()
    }
    
    // Permetti l'accesso alla pagina di login e alle API di login/logout
    if (pathname === '/admin/login' || pathname === '/api/admin/login' || pathname === '/api/admin/logout') {
      return NextResponse.next()
    }
    
    // Verifica autenticazione SOLO per le route admin (pagine E API)
    const authCookie = request.cookies.get('admin-auth')
    const isAuthenticated = authCookie && authCookie.value === 'authenticated'
    
    if (!isAuthenticated) {
      // Se è una richiesta API, restituisci 401 invece di redirect
      if (pathname.startsWith('/api/admin/')) {
        return NextResponse.json(
          { error: "Non autorizzato", code: "UNAUTHORIZED" },
          { status: 401 }
        )
      }
      // Per le pagine admin, reindirizza al login
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
    
    // Autenticato: permette l'accesso alle route admin
  }
  
  // Per booking.montecchiaperformancecenter.it, lascia passare tutto normalmente
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
