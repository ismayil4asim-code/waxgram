import { NextRequest, NextResponse } from 'next/server'

// In-memory хранилище для кодов
const codes = new Map<string, { code: string; expiresAt: number }>()

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()
    
    if (!phone) {
      return NextResponse.json({ error: 'Телефон обязателен' }, { status: 400 })
    }
    
    const normalizedPhone = phone.replace(/[^\d+]/g, '').replace(/^8/, '+7')
    
    // Генерируем код
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = Date.now() + 5 * 60 * 1000
    
    // Сохраняем в памяти
    codes.set(normalizedPhone, { code, expiresAt })
    
    console.log('=== SEND CODE DEBUG ===')
    console.log('Phone:', normalizedPhone)
    console.log('Generated code:', code)
    console.log('Expires at:', new Date(expiresAt))
    console.log('All codes:', Array.from(codes.entries()))
    
    return NextResponse.json({
      success: true,
      message: 'Код отправлен',
      debugCode: code,
      expiresIn: 300
    })
    
  } catch (error) {
    console.error('Send code error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}