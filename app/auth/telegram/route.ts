import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { telegramId, username, firstName, lastName, photoUrl } = await request.json()
    
    if (!telegramId) {
      return NextResponse.json({ error: 'Telegram ID обязателен' }, { status: 400 })
    }
    
    // Проверяем существование пользователя
    let { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('id, username, avatar_url')
      .eq('telegram_id', telegramId)
      .single()
    
    let userId: string
    let isNewUser = false
    
    if (existingUser) {
      userId = existingUser.id
      // Обновляем данные
      await supabaseAdmin
        .from('profiles')
        .update({
          username: username || existingUser.username,
          avatar_url: photoUrl || existingUser.avatar_url,
          online: true,
          last_seen: new Date().toISOString()
        })
        .eq('id', userId)
    } else {
      isNewUser = true
      // Создаем нового пользователя
      const newUsername = username || `tg_${telegramId}`
      const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Пользователь Telegram'
      
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert({
          telegram_id: telegramId,
          username: newUsername,
          full_name: fullName,
          avatar_url: photoUrl || null,
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
    
    // Генерируем токен сессии
    const sessionToken = Buffer.from(`${userId}:${Date.now()}`).toString('base64')
    
    return NextResponse.json({
      success: true,
      userId: userId,
      username: existingUser?.username || username || `tg_${telegramId}`,
      isNewUser: isNewUser,
      sessionToken: sessionToken
    })
    
  } catch (error) {
    console.error('Telegram auth error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}