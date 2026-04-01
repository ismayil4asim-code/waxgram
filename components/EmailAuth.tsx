'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMail, FiCheckCircle, FiArrowRight, FiShield } from 'react-icons/fi'
import { RegisterForm } from './RegisterForm'

export function EmailAuth() {
  const [step, setStep] = useState<'email' | 'code' | 'register'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timer, setTimer] = useState(0)
  const [debugCode, setDebugCode] = useState('')
  const router = useRouter()

  const sendCode = async () => {
    if (!email) return
    setLoading(true)
    setError('')
    setDebugCode('')

    try {
      // Генерируем код на клиенте
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString()
      setDebugCode(generatedCode)
      
      // Сохраняем код в localStorage для проверки
      localStorage.setItem(`temp_code_${email}`, generatedCode)
      localStorage.setItem(`temp_code_expires_${email}`, (Date.now() + 5 * 60 * 1000).toString())

      setStep('code')
      setTimer(60)

      const interval = setInterval(() => {
        setTimer(t => {
          if (t <= 1) clearInterval(interval)
          return t - 1
        })
      }, 1000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const verifyCode = async () => {
    if (code.length !== 6) return
    setLoading(true)
    setError('')

    try {
      const storedCode = localStorage.getItem(`temp_code_${email}`)
      const storedExpires = localStorage.getItem(`temp_code_expires_${email}`)
      
      if (!storedCode) {
        throw new Error('Код не найден. Запросите новый код')
      }
      
      if (Date.now() > parseInt(storedExpires)) {
        localStorage.removeItem(`temp_code_${email}`)
        localStorage.removeItem(`temp_code_expires_${email}`)
        throw new Error('Код истек. Запросите новый')
      }
      
      if (storedCode !== code) {
        throw new Error('Неверный код')
      }
      
      // Код верный, очищаем
      localStorage.removeItem(`temp_code_${email}`)
      localStorage.removeItem(`temp_code_expires_${email}`)
      
      // Проверяем существование пользователя
      const savedUsers = localStorage.getItem('users')
      const users = savedUsers ? JSON.parse(savedUsers) : []
      const existingUser = users.find((u: any) => u.email === email)
      
      if (existingUser) {
        // Существующий пользователь - вход
        localStorage.setItem('temp_user_id', existingUser.id)
        localStorage.setItem('temp_email', existingUser.email)
        localStorage.setItem('temp_username', existingUser.username)
        router.push('/')
      } else {
        // Новый пользователь - регистрация
        setStep('register')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (registerData: { username: string; bio: string; birthDate: string; avatarUrl: string | null }) => {
    setLoading(true)
    
    try {
      const savedUsers = localStorage.getItem('users')
      const users = savedUsers ? JSON.parse(savedUsers) : []
      
      const newUser = {
        id: Date.now().toString(),
        email: email,
        username: registerData.username,
        bio: registerData.bio,
        birthDate: registerData.birthDate,
        avatarUrl: registerData.avatarUrl,
        createdAt: new Date().toISOString()
      }
      
      users.push(newUser)
      localStorage.setItem('users', JSON.stringify(users))
      
      localStorage.setItem('temp_user_id', newUser.id)
      localStorage.setItem('temp_email', newUser.email)
      localStorage.setItem('temp_username', newUser.username)
      
      if (registerData.avatarUrl) {
        localStorage.setItem('user_avatar', registerData.avatarUrl)
      }
      
      router.push('/')
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {step === 'email' && (
          <motion.div
            key="email"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-8"
          >
            <div className="relative mb-6">
              <FiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-gray-700 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white"
                onKeyDown={(e) => e.key === 'Enter' && sendCode()}
              />
            </div>
            
            {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}
            
            <button
              onClick={sendCode}
              disabled={loading || !email}
              className="w-full bg-gradient-to-r from-[#2b6bff] to-[#0055ff] text-white py-3 rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <div className="spinner w-5 h-5"></div> : <>Получить код <FiArrowRight /></>}
            </button>
          </motion.div>
        )}

        {step === 'code' && (
          <motion.div
            key="code"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-8"
          >
            <p className="text-gray-400 text-center mb-4">
              Код отправлен на <span className="text-white">{email}</span>
            </p>
            
            {debugCode && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                <p className="text-xs text-green-400 text-center">
                  🔧 Ваш код: <strong className="text-lg ml-1">{debugCode}</strong>
                </p>
              </div>
            )}
            
            <div className="relative mb-4">
              <FiCheckCircle className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-значный код"
                maxLength={6}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-gray-700 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white text-center text-2xl tracking-widest"
                onKeyDown={(e) => e.key === 'Enter' && verifyCode()}
              />
            </div>
            
            {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}
            
            <button
              onClick={verifyCode}
              disabled={loading || code.length !== 6}
              className="w-full bg-gradient-to-r from-[#2b6bff] to-[#0055ff] text-white py-3 rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {loading ? 'Проверка...' : 'Войти'}
            </button>
            
            <button
              onClick={sendCode}
              disabled={timer > 0}
              className="w-full mt-3 text-[#2b6bff] text-sm disabled:opacity-50"
            >
              {timer > 0 ? `Отправить повторно через ${timer} сек` : 'Отправить код повторно'}
            </button>
          </motion.div>
        )}

        {step === 'register' && (
          <RegisterForm
            email={email}
            onRegister={handleRegister}
            onBack={() => setStep('code')}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
