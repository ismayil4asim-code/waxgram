'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMail, FiCheckCircle, FiArrowRight, FiShield, FiUser } from 'react-icons/fi'
import { RegisterForm } from './RegisterForm'

export function EmailAuth() {
  const [step, setStep] = useState<'email' | 'code' | 'register'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timer, setTimer] = useState(0)
  const router = useRouter()

  const sendCode = async () => {
    if (!email) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/send-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

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
      const res = await fetch('/api/auth/verify-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      if (data.isNewUser) {
        // Новый пользователь - показываем форму регистрации
        setStep('register')
      } else {
        // Существующий пользователь - сразу входим
        localStorage.setItem('temp_user_id', data.userId)
        localStorage.setItem('temp_email', data.email)
        localStorage.setItem('temp_username', data.username)
        router.push('/')
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
      const res = await fetch('/api/auth/verify-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          code, 
          ...registerData 
        })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      localStorage.setItem('temp_user_id', data.userId)
      localStorage.setItem('temp_email', data.email)
      localStorage.setItem('temp_username', data.username)
      
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {step === 'email' && (
          <motion.div
            key="email"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 bg-gradient-to-br from-[#2b6bff] to-[#0055ff] rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <img src="https://i.ibb.co/dsywjJ5Y/W.png" alt="WaxTG" className="w-12 h-12 rounded-full" />
              </motion.div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#2b6bff] to-[#00c6ff] bg-clip-text text-transparent">
                WaxTG
              </h1>
              <p className="text-gray-400 text-sm mt-2">Войдите по email</p>
            </div>

            <div className="glass-card p-8">
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
              
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              
              <button
                onClick={sendCode}
                disabled={loading || !email}
                className="w-full bg-gradient-to-r from-[#2b6bff] to-[#0055ff] text-white py-3 rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <div className="spinner w-5 h-5"></div> : <>Получить код <FiArrowRight /></>}
              </button>
            </div>
          </motion.div>
        )}

        {step === 'code' && (
          <motion.div
            key="code"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md"
          >
            <div className="glass-card p-8">
              <p className="text-gray-400 text-center mb-4">
                Код отправлен на <span className="text-white">{email}</span>
              </p>
              
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
            </div>
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
      
      <p className="fixed bottom-4 left-0 right-0 text-center text-gray-500 text-xs flex items-center justify-center gap-2">
        <FiShield size={12} />
        WaxTG — безопасный мессенджер
      </p>
    </div>
  )
}