import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { userId, password, email } = await request.json()
    
    if (!userId || !password) {
      return NextResponse.json({ error: 'ID пользователя и пароль обязательны' }, { status: 400 })
    }
    
    // Получаем пользователя
    const { data: user, error } = await supabaseAdmin
      .from('profiles')
      .select('id, username, password_hash, has_password')
      .eq('id', userId)
      .single()
    
    if (error || !user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 400 })
    }
    
    // Если у пользователя нет пароля, создаем его
    if (!user.has_password || !user.password_hash) {
      const hashedPassword = await bcrypt.hash(password, 10)
      await supabaseAdmin
        .from('profiles')
        .update({ 
          password_hash: hashedPassword,
          has_password: true
        })
        .eq('id', userId)
      
      return NextResponse.json({
        success: true,
        userId: user.id,
        email: email,
        username: user.username
      })
    }
    
    // Проверяем пароль
    const isValid = await bcrypt.compare(password, user.password_hash)
    
    if (!isValid) {
      return NextResponse.json({ error: 'Неверный пароль' }, { status: 400 })
    }
    
    return NextResponse.json({
      success: true,
      userId: user.id,
      email: email,
      username: user.username
    })
    
  } catch (error) {
    console.error('Verify password error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}
