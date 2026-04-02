import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Хранилище статуса обслуживания (в реальном приложении храните в БД)
let isMaintenanceMode = false
let maintenanceMessage = 'Технические работы. Пожалуйста, зайдите позже.'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    // Проверяем, является ли пользователь разработчиком
    let isDeveloper = false
    
    if (token) {
      try {
        const { data: user } = await supabaseAdmin
          .from('profiles')
          .select('verified, verified_type')
          .eq('id', token)
          .single()
        
        isDeveloper = user?.verified && user?.verified_type === 'developer'
      } catch (error) {
        console.error('Auth check error:', error)
      }
    }
    
    return NextResponse.json({
      maintenance: isMaintenanceMode,
      message: maintenanceMessage,
      isDeveloper
    })
  } catch (error) {
    console.error('Maintenance check error:', error)
    return NextResponse.json({ maintenance: false })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { enabled, message, token } = await request.json()
    
    // Проверяем права разработчика
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    const { data: user } = await supabaseAdmin
      .from('profiles')
      .select('verified, verified_type')
      .eq('id', token)
      .single()
    
    if (!user?.verified || user.verified_type !== 'developer') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }
    
    isMaintenanceMode = enabled
    if (message) {
      maintenanceMessage = message
    }
    
    return NextResponse.json({
      success: true,
      maintenance: isMaintenanceMode,
      message: maintenanceMessage
    })
  } catch (error) {
    console.error('Set maintenance error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}
