'use client'

import { EmailAuth } from '@/components/EmailAuth'
import { motion } from 'framer-motion'
import { FiShield } from 'react-icons/fi'

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1a] to-[#0a0a0a]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="w-20 h-20 bg-gradient-to-br from-[#2b6bff] to-[#0055ff] rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <img src="https://i.ibb.co/dsywjJ5Y/W.png" alt="WaxGram" className="w-12 h-12 rounded-full" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold bg-gradient-to-r from-[#2b6bff] to-[#00c6ff] bg-clip-text text-transparent"
          >
            WaxGram
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-sm mt-2"
          >
            Войдите по email
          </motion.p>
        </div>

        <EmailAuth />
        
        <p className="text-center text-gray-500 text-xs mt-6 flex items-center justify-center gap-2">
          <FiShield size={12} />
          Сквозное шифрование • Ваши данные в безопасности
        </p>
      </motion.div>
    </div>
  )
}
