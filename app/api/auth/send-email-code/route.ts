import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email обязателен' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Неверный формат email' }, { status: 400 })
    }

    // Генерируем код
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    // Сохраняем код в базу
    const { error: dbError } = await supabaseAdmin
      .from('email_verification_codes')
      .insert({
        email: email,
        code: code,
        expires_at: expiresAt.toISOString()
      })

    if (dbError) {
      console.error('DB Error:', dbError)
      return NextResponse.json({ error: 'Ошибка базы данных' }, { status: 500 })
    }

    // Отправляем письмо через Gmail
    await transporter.sendMail({
      from: `WaxGram <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Код подтверждения WaxGram',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0a0a0a; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .card { background: linear-gradient(135deg, #1a1a2e, #0f0f1a); border-radius: 24px; padding: 40px; border: 1px solid rgba(43,107,255,0.2); }
            .logo { text-align: center; margin-bottom: 30px; }
            .logo img { width: 60px; height: 60px; border-radius: 50%; }
            h1 { color: #fff; font-size: 24px; text-align: center; margin-bottom: 20px; }
            .code { background: rgba(43,107,255,0.1); border: 1px solid rgba(43,107,255,0.3); border-radius: 16px; padding: 20px; text-align: center; margin: 30px 0; }
            .code-value { font-size: 36px; font-weight: bold; color: #2b6bff; letter-spacing: 8px; font-family: monospace; }
            .text { color: #9ca3af; text-align: center; line-height: 1.6; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="logo">
                <img src="https://i.ibb.co/dsywjJ5Y/W.png" alt="WaxGram">
              </div>
              <h1>Подтверждение входа</h1>
              <div class="text">Используйте код ниже для входа в WaxGram. Код действителен 5 минут.</div>
              <div class="code">
                <div class="code-value">${code}</div>
              </div>
              <div class="text">Если вы не запрашивали этот код, просто проигнорируйте это письмо.</div>
              <div class="footer">WaxGram — безопасный мессенджер</div>
            </div>
          </div>
        </body>
        </html>
      `
    })

    return NextResponse.json({
      success: true,
      message: 'Код отправлен на email',
      expiresIn: 300
    })

  } catch (error) {
    console.error('Send email error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}
