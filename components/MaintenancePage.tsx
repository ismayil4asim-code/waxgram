'use client'

import { motion } from 'framer-motion'
import { FiTool, FiClock, FiMail, FiShield } from 'react-icons/fi'

interface MaintenancePageProps {
  message?: string
}

export function MaintenancePage({ message }: MaintenancePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1a] to-[#0a0a0a] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center"
        >
          <FiTool className="text-white text-4xl" />
        </motion.div>
        
        <h1 className="text-3xl font-bold text-white mb-2">Технические работы</h1>
        <p className="text-gray-400 mb-6">
          {message || 'Мы проводим технические работы. Пожалуйста, зайдите позже.'}
        </p>
        
        <div className="glass-card p-6 space-y-4 text-left">
          <div className="flex items-center gap-3">
            <FiClock className="text-yellow-400" size={20} />
            <div>
              <p className="text-white text-sm font-medium">Ориентировочное время</p>
              <p className="text-gray-400 text-xs">Обычно работы занимают не более часа</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <FiMail className="text-yellow-400" size={20} />
            <div>
              <p className="text-white text-sm font-medium">Связь с поддержкой</p>
              <p className="text-gray-400 text-xs">support@waxgram.com</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <FiShield className="text-yellow-400" size={20} />
            <div>
              <p className="text-white text-sm font-medium">Ваши данные в безопасности</p>
              <p className="text-gray-400 text-xs">Все сообщения сохранятся</p>
            </div>
          </div>
        </div>
        
        <p className="text-gray-500 text-xs mt-6">
          WaxGram — безопасный мессенджер
        </p>
      </motion.div>
    </div>
  )
}
