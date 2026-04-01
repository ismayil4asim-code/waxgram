import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { email, code, username, bio, birthDate, avatarUrl } = await request.json()
    
    if (!email || !code) {
      return NextResponse.json({ error: 'Email и код обязательны' }, { status: 400 })
    }
    
    // Проверяем код в базе данных
    const { data: codeRecord, error: codeError } = await supabaseAdmin
      .from('email_verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (codeError || !codeRecord) {
      return NextResponse.json({ error: 'Неверный или истекший код' }, { status: 400 })
    }
    
    // Отмечаем код как использованный
    await supabaseAdmin
      .from('email_verification_codes')
      .update({ used: true })
      .eq('id', codeRecord.id)
    
    // Проверяем существует ли пользователь
    let { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('id, username, email_verified')
      .eq('email', email)
      .single()
    
    let userId: string
    let isNewUser = false
    
    if (existingUser) {
      userId = existingUser.id
      // Обновляем статус верификации email
      await supabaseAdmin
        .from('profiles')
        .update({ email_verified: true })
        .eq('id', userId)
    } else {
      isNewUser = true
      // Создаем нового пользователя
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert({
          email: email,
          username: username || email.split('@')[0],
          bio: bio || '',
          birth_date: birthDate || null,
          avatar_url: avatarUrl || null,
          email_verified: true,
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
      isNewUser: isNewUser,
      username: existingUser?.username || username || email.split('@')[0]
    })
    
  } catch (error) {
    console.error('Verify code error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}