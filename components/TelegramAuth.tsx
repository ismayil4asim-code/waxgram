'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FiSend, FiShield } from 'react-icons/fi'

export function TelegramAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleTelegramLogin = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Открываем Telegram бота
      window.open('https://t.me/WaxGramBot', '_blank')
      
      // Ждем ответ от бота через WebSocket или polling
      const checkInterval = setInterval(async () => {
        const token = localStorage.getItem('telegram_auth_token')
        if (token) {
          clearInterval(checkInterval)
          const response = await fetch('/api/auth/telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          })
          
          const data = await response.json()
          if (data.success) {
            localStorage.setItem('temp_user_id', data.userId)
            localStorage.setItem('temp_username', data.username)
            router.push('/')
          }
        }
      }, 1000)
      
      setTimeout(() => {
        clearInterval(checkInterval)
        setLoading(false)
      }, 30000)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleTelegramLogin}
        disabled={loading}
        className="w-full bg-gradient-to-r from-[#2b6bff] to-[#0055ff] text-white py-3 rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <div className="spinner w-5 h-5"></div>
        ) : (
          <>
            <FiSend size={20} />
            Войти через Telegram
          </>
        )}
      </motion.button>
      
      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}
      
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#0f0f1a] px-2 text-gray-500">скоро</span>
        </div>
      </div>
      
      <p className="text-center text-gray-500 text-xs flex items-center justify-center gap-2">
        <FiShield size={12} />
        WaxGram — безопасный мессенджер
      </p>
    </div>
  )
}