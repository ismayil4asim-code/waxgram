'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSend, FiSmartphone, FiCheckCircle, FiShield } from 'react-icons/fi'

export function PhoneAuth() {
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timer, setTimer] = useState(0)
  const [debugCode, setDebugCode] = useState('')
  const router = useRouter()

  const normalizePhone = (phone: string) => {
    return phone.replace(/[^\d+]/g, '').replace(/^8/, '+7')
  }

  const sendCode = async () => {
    if (!phone) return
    setLoading(true)
    setError('')
    setDebugCode('')

    try {
      const normalizedPhone = normalizePhone(phone)
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      setStep('code')
      setTimer(60)
      
      if (data.debugCode) {
        setDebugCode(data.debugCode)
      }

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
      const normalizedPhone = normalizePhone(phone)
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone, code })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      if (data.userId) {
        localStorage.setItem('temp_user_id', data.userId)
        localStorage.setItem('temp_phone', normalizedPhone)
        
        // Анимация перед переходом
        setTimeout(() => {
          window.location.href = '/chat'
        }, 500)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="w-20 h-20 bg-gradient-to-br from-[#2b6bff] to-[#0055ff] rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <FiShield className="text-white text-3xl" />
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl font-bold gradient-text mb-2"
            >
              Messenger
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-sm"
            >
              Private & Secure Communication
            </motion.p>
          </div>

          <div className="glass-card p-8">
            {step === 'phone' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="relative">
                  <FiSmartphone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 999 123-45-67"
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-gray-700 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white placeholder-gray-500 transition-all input-glow"
                    onKeyDown={(e) => e.key === 'Enter' && sendCode()}
                  />
                </div>
                
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-red-400 text-sm mt-2 text-center"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={sendCode}
                  disabled={loading || !phone}
                  className="w-full mt-6 bg-gradient-to-r from-[#2b6bff] to-[#0055ff] text-white py-3 rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-all relative overflow-hidden btn-hover"
                >
                  {loading ? (
                    <div className="spinner mx-auto"></div>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Continue <FiSend className="text-sm" />
                    </span>
                  )}
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-gray-400 text-sm text-center mb-4">
                  We sent a code to <span className="text-white font-medium">{phone}</span>
                </p>
                
                {debugCode && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl"
                  >
                    <p className="text-xs text-green-400 text-center">
                      🔧 Dev Mode: Your code is <strong className="text-lg ml-1">{debugCode}</strong>
                    </p>
                  </motion.div>
                )}
                
                <div className="relative">
                  <FiCheckCircle className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-gray-700 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white placeholder-gray-500 text-center text-2xl tracking-widest transition-all input-glow"
                    onKeyDown={(e) => e.key === 'Enter' && verifyCode()}
                  />
                </div>
                
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-red-400 text-sm mt-2 text-center"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={verifyCode}
                  disabled={loading || code.length !== 6}
                  className="w-full mt-6 bg-gradient-to-r from-[#2b6bff] to-[#0055ff] text-white py-3 rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-all btn-hover"
                >
                  {loading ? (
                    <div className="spinner mx-auto"></div>
                  ) : (
                    'Sign In'
                  )}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={sendCode}
                  disabled={timer > 0}
                  className="w-full mt-3 text-[#2b6bff] text-sm disabled:opacity-50 transition-all"
                >
                  {timer > 0 ? `Resend code in ${timer}s` : 'Resend code'}
                </motion.button>
              </motion.div>
            )}
          </div>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-gray-500 text-xs mt-6"
          >
            End-to-end encrypted • Private by design
          </motion.p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}