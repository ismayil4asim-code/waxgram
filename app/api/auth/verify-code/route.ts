import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Используем то же глобальное хранилище
declare global {
  var emailCodes: Map<string, { code: string; expiresAt: number }>
}

const codes = global.emailCodes || new Map()

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()
    
    console.log('=== VERIFY EMAIL CODE ===')
    console.log('Email:', email)
    console.log('Entered code:', code)
    console.log('All codes:', Array.from(codes.entries()))
    
    if (!email || !code) {
      return NextResponse.json({ error: 'Email и код обязательны' }, { status: 400 })
    }
    
    const stored = codes.get(email)
    
    if (!stored) {
      console.log('No code found for this email')
      return NextResponse.json({ error: 'Код не найден. Запросите новый код' }, { status: 400 })
    }
    
    console.log('Stored code:', stored.code)
    console.log('Stored expires:', new Date(stored.expiresAt))
    console.log('Current time:', new Date())
    
    if (Date.now() > stored.expiresAt) {
      console.log('Code expired')
      codes.delete(email)
      return NextResponse.json({ error: 'Код истек. Запросите новый' }, { status: 400 })
    }
    
    if (stored.code !== code) {
      console.log('Code mismatch')
      return NextResponse.json({ error: 'Неверный код' }, { status: 400 })
    }
    
    console.log('Code verified successfully!')
    
    // Удаляем использованный код
    codes.delete(email)
    
    // Проверяем существование пользователя
    let { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('id, username, avatar_url')
      .eq('email', email)
      .single()
    
    let userId: string
    let username: string
    
    if (existingUser) {
      userId = existingUser.id
      username = existingUser.username || email.split('@')[0]
    } else {
      // Создаем нового пользователя
      username = email.split('@')[0]
      
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert({
          email: email,
          username: username,
          online: true,
          last_seen: new Date().toISOString()
        })
        .select()
        .single()
      
      if (createError) {
        console.error('Create user error:', createError)
        return NextResponse.json({ error: 'Ошибка создания пользователя' }, { status: 500 })
      }
      
      userId = newUser.id
    }
    
    // Обновляем статус онлайн
    await supabaseAdmin
      .from('profiles')
      .update({ online: true, last_seen: new Date().toISOString() })
      .eq('id', userId)
    
    return NextResponse.json({
      success: true,
      userId: userId,
      email: email,
      username: username
    })
    
  } catch (error) {
    console.error('Verify code error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}