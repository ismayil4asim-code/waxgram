'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi'

export default function TelegramCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    const authenticate = async () => {
      if (!token) {
        setStatus('error')
        setError('Токен не найден')
        return
      }
      
      try {
        // Получаем данные из токена
        const response = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })
        
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error)
        }
        
        // Сохраняем данные пользователя
        localStorage.setItem('temp_user_id', data.userId)
        localStorage.setItem('temp_username', data.username)
        
        setStatus('success')
        
        // Перенаправляем в мессенджер через 2 секунды
        setTimeout(() => {
          router.push('/')
        }, 2000)
        
      } catch (err: any) {
        setStatus('error')
        setError(err.message)
      }
    }
    
    authenticate()
  }, [token, router])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1a] to-[#0a0a0a]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4">
              <FiLoader className="w-full h-full text-[#2b6bff] animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Авторизация через Telegram
            </h2>
            <p className="text-gray-400">
              Подождите, идет вход...
            </p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
              <FiCheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Успешный вход!
            </h2>
            <p className="text-gray-400">
              Перенаправляем в мессенджер...
            </p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-red-500 rounded-full flex items-center justify-center">
              <FiAlertCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Ошибка авторизации
            </h2>
            <p className="text-gray-400 mb-4">
              {error}
            </p>
            <button
              onClick={() => router.push('/auth')}
              className="px-6 py-2 bg-[#2b6bff] text-white rounded-lg hover:bg-[#0055ff] transition-colors"
            >
              Вернуться на главную
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}