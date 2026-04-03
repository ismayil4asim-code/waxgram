import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // Безопасность — на всех маршрутах
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // API auth — не кэшируем
  if (pathname.startsWith('/api/auth/')) {
    response.headers.set('Cache-Control', 'no-store, must-revalidate')
    return response
  }

  // Остальные API — короткий кэш
  if (pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=86400')
    return response
  }

  return response
}

export const config = {
  matcher: ['/api/:path*'],
}
