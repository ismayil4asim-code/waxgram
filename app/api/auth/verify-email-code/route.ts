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
      .select('id, username')
      .eq('email', email)
      .single()
    
    // Если пользователь существует - вход
    if (existingUser) {
      // Обновляем статус онлайн
      await supabaseAdmin
        .from('profiles')
        .update({ online: true, last_seen: new Date().toISOString() })
        .eq('id', existingUser.id)
      
      return NextResponse.json({
        success: true,
        userId: existingUser.id,
        email: email,
        isNewUser: false,
        username: existingUser.username
      })
    }
    
    // Если пользователь не существует и нет данных для регистрации
    if (!username) {
      return NextResponse.json({ error: 'Требуется регистрация' }, { status: 400 })
    }
    
    // Создаем нового пользователя
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('profiles')
      .insert({
        email: email,
        username: username,
        bio: bio || '',
        birth_date: birthDate || null,
        avatar_url: avatarUrl || null,
        online: true,
        last_seen: new Date().toISOString()
      })
      .select()
      .single()
    
    if (createError) {
      console.error('Create user error:', createError)
      return NextResponse.json({ error: 'Ошибка создания пользователя: ' + createError.message }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      userId: newUser.id,
      email: email,
      isNewUser: true,
      username: username
    })
    
  } catch (error) {
    console.error('Verify code error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}
