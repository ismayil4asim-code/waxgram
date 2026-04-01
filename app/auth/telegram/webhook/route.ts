import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, callback_query } = body
    
    if (message) {
      const chatId = message.chat.id
      const text = message.text
      
      // Обработка команды /start
      if (text === '/start') {
        await sendMessage(chatId, `
🔐 *Добро пожаловать в WaxTG!*

Нажмите кнопку ниже, чтобы авторизоваться в мессенджере.

*Ваш аккаунт будет создан автоматически!*

⚡️ Быстро и безопасно
🔒 Сквозное шифрование
📱 Доступ с любого устройства
        `, {
          reply_markup: {
            inline_keyboard: [[
              {
                text: "🚀 Войти в WaxTG",
                callback_data: "login",
                web_app: {
                  url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/telegram-callback?chat_id=${chatId}`
                }
              }
            ]]
          }
        })
      }
    }
    
    if (callback_query) {
      const chatId = callback_query.message.chat.id
      const data = callback_query.data
      
      if (data === 'login') {
        // Генерируем токен авторизации
        const authToken = Buffer.from(`${chatId}:${Date.now()}`).toString('base64')
        
        // Сохраняем токен в базу
        await supabaseAdmin
          .from('telegram_auth_tokens')
          .insert({
            chat_id: chatId,
            token: authToken,
            expires_at: new Date(Date.now() + 5 * 60 * 1000)
          })
        
        // Отправляем ссылку для авторизации
        await sendMessage(chatId, `
✅ *Авторизация в WaxTG*

Нажмите на кнопку ниже, чтобы войти в мессенджер.

🔗 Ссылка действительна 5 минут
        `, {
          reply_markup: {
            inline_keyboard: [[
              {
                text: "🔐 Подтвердить вход",
                url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/telegram-callback?token=${authToken}`
              }
            ]]
          }
        })
      }
    }
    
    return NextResponse.json({ ok: true })
    
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

async function sendMessage(chatId: number, text: string, options?: any) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown',
    ...options
  }
  
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}