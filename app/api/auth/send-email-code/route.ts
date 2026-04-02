import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    console.log('=== SEND EMAIL CODE ===')
    console.log('Email:', email)
    
    if (!email) {
      return NextResponse.json({ error: 'Email обязателен' }, { status: 400 })
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Неверный формат email' }, { status: 400 })
    }
    
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
    
    console.log('Generated code:', code)
    
    // Сохраняем код в базу данных
    try {
      const { error: dbError } = await supabaseAdmin
        .from('email_verification_codes')
        .insert({
          email: email,
          code: code,
          expires_at: expiresAt.toISOString()
        })
      
      if (dbError) {
        console.error('DB Error:', dbError)
      }
    } catch (dbErr) {
      console.error('Database error:', dbErr)
    }
    
    // В режиме разработки просто возвращаем код на экран
    // Для реальной отправки email используйте Resend или другой сервис
    return NextResponse.json({
      success: true,
      message: 'Код отправлен',
      debugCode: code,
      expiresIn: 300
    })
    
  } catch (error) {
    console.error('Send email error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}
