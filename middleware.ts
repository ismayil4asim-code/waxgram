import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Хранилище статуса обслуживания (в реальном приложении используйте БД)
let maintenanceCache: { enabled: boolean; message: string; timestamp: number } = {
  enabled: false,
  message: '',
  timestamp: 0
}

async function getMaintenanceStatus() {
  // Кэш на 10 секунд
  if (Date.now() - maintenanceCache.timestamp < 10000) {
    return maintenanceCache
  }
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/maintenance`, {
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
    const data = await response.json()
    maintenanceCache = {
      enabled: data.maintenance,
      message: data.message,
      timestamp: Date.now()
    }
    return maintenanceCache
  } catch (error) {
    console.error('Maintenance check error:', error)
    return maintenanceCache
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Пропускаем API запросы и статику
  if (pathname.startsWith('/api/') || 
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/auth') ||
      pathname.includes('.png') ||
      pathname.includes('.ico') ||
      pathname.includes('.json')) {
    return NextResponse.next()
  }
  
  const maintenance = await getMaintenanceStatus()
  
  if (maintenance.enabled) {
    // Проверяем, является ли пользователь разработчиком
    const token = request.cookies.get('temp_user_id')?.value
    let isDeveloper = false
    
    if (token) {
      try {
        const { supabaseAdmin } = await import('@/lib/supabase/admin')
        const { data: user } = await supabaseAdmin
          .from('profiles')
          .select('verified, verified_type')
          .eq('id', token)
          .single()
        
        isDeveloper = user?.verified && user?.verified_type === 'developer'
      } catch (error) {
        console.error('Developer check error:', error)
      }
    }
    
    // Разработчики могут проходить
    if (!isDeveloper) {
      const url = new URL('/maintenance', request.url)
      url.searchParams.set('message', maintenance.message)
      return NextResponse.rewrite(url)
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth (auth pages)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|auth).*)',
  ],
}
