import { NextRequest, NextResponse } from 'next/server'

const IMG_API_KEY = '864a1c4438fd4351e662fccce317ba50'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const email = formData.get('email') as string
    
    if (!file || !email) {
      return NextResponse.json({ error: 'Файл и email обязательны' }, { status: 400 })
    }
    
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        key: IMG_API_KEY,
        image: base64,
        name: `avatar_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
      })
    })
    
    const data = await response.json()
    
    if (data.success) {
      return NextResponse.json({
        success: true,
        avatarUrl: data.data.url
      })
    } else {
      return NextResponse.json({ error: 'Ошибка загрузки' }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}