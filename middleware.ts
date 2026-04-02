import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const CACHE_MAX_AGE = 60 * 60 // 1 час
const CACHE_STALE_WHILE_REVALIDATE = 86400 // 24 часа

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Статические файлы - долгий кэш
  if (pathname.match(/\.(jpg|jpeg|png|webp|avif|ico|svg|woff|woff2|ttf|eot|css|js)$/)) {
    const response = NextResponse.next()
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    return response
  }
  
  // API кэширование
  if (pathname.startsWith('/api/')) {
    // Не кэшируем авторизацию
    if (pathname.includes('/auth/')) {
      const response = NextResponse.next()
      response.headers.set('Cache-Control', 'no-store, must-revalidate')
      return response
    }
    
    const response = NextResponse.next()
    response.headers.set('Cache-Control', `public, max-age=60, stale-while-revalidate=${CACHE_STALE_WHILE_REVALIDATE}`)
    return response
  }
  
  const response = NextResponse.next()
  
  // HTML кэширование
  if (pathname === '/' || pathname === '/feed' || pathname === '/chats') {
    response.headers.set('Cache-Control', `public, max-age=${CACHE_MAX_AGE}, stale-while-revalidate=${CACHE_STALE_WHILE_REVALIDATE}`)
  } else {
    response.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
  }
  
  // Сжатие
  response.headers.set('Content-Encoding', 'gzip')
  response.headers.set('Vary', 'Accept-Encoding')
  
  // Безопасность
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
