import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  
  // Se l'accesso è da admin.booking.montecchiaperformancecenter.it
  if (host.startsWith('admin.booking.montecchiaperformancecenter.it')) {
    const pathname = request.nextUrl.pathname
    
    // Permetti l'accesso alla pagina di login e alle API di login/logout
    if (pathname === '/admin/login' || pathname === '/api/admin/login' || pathname === '/api/admin/logout') {
      return NextResponse.next()
    }
    
    // Verifica autenticazione per tutte le route admin (pagine E API)
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
      // Per le pagine, reindirizza al login
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
    
    // Autenticato: se non è già su una route admin, reindirizza a /admin/bookings
    if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
      return NextResponse.rewrite(new URL('/admin/bookings', request.url))
    }
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
