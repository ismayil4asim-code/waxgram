import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('=== VERIFY EMAIL CODE ===')
    console.log('Request body:', body)
    
    const { email, code, username, firstName, lastName, bio, birthDate, avatarUrl, password } = body
    
    if (!email || !code) {
      console.log('Missing email or code')
      return NextResponse.json({ error: 'Email и код обязательны' }, { status: 400 })
    }
    
    // Проверяем код в базе данных
    const { data: codeRecord, error: codeError } = await supabaseAdmin
      .from('email_verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    console.log('Code record found:', !!codeRecord)
    
    if (codeError || !codeRecord) {
      console.log('Code error:', codeError)
      return NextResponse.json({ error: 'Неверный или истекший код' }, { status: 400 })
    }
    
    // Проверяем существует ли пользователь
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('id, username, has_password')
      .eq('email', email)
      .single()
    
    console.log('Existing user found:', !!existingUser)
    
    // Если пользователь существует
    if (existingUser) {
      // Отмечаем код как использованный
      await supabaseAdmin
        .from('email_verification_codes')
        .update({ used: true })
        .eq('id', codeRecord.id)
      
      return NextResponse.json({
        success: true,
        userId: existingUser.id,
        email: email,
        hasPassword: existingUser.has_password || false
      })
    }
    
    // Если пользователь не существует и нет данных для регистрации
    if (!username) {
      return NextResponse.json({ error: 'Требуется регистрация' }, { status: 400 })
    }
    
    if (!password) {
      return NextResponse.json({ error: 'Пароль обязателен' }, { status: 400 })
    }
    
    // Проверяем уникальность username
    const { data: existingUsername } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()
    
    if (existingUsername) {
      return NextResponse.json({ error: 'Это имя пользователя уже занято' }, { status: 400 })
    }
    
    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10)
    
    console.log('Creating new user with data:', { email, username, firstName, lastName, bio, birthDate })
    
    // Создаем нового пользователя
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('profiles')
      .insert({
        email: email,
        username: username,
        first_name: firstName || null,
        last_name: lastName || null,
        bio: bio || '',
        birth_date: birthDate || null,
        avatar_url: avatarUrl || null,
        password_hash: hashedPassword,
        has_password: true,
        online: true,
        last_seen: new Date().toISOString()
      })
      .select()
      .single()
    
    if (createError) {
      console.error('Create user error:', createError)
      return NextResponse.json({ error: 'Ошибка создания пользователя: ' + createError.message }, { status: 500 })
    }
    
    console.log('User created successfully:', newUser.id)
    
    // Отмечаем код как использованный
    await supabaseAdmin
      .from('email_verification_codes')
      .update({ used: true })
      .eq('id', codeRecord.id)
    
    return NextResponse.json({
      success: true,
      userId: newUser.id,
      email: email,
      username: username,
      hasPassword: true,
      isNewUser: true
    })
    
  } catch (error) {
    console.error('Verify code error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка: ' + String(error) }, { status: 500 })
  }
}
