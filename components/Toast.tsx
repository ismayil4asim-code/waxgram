'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { FiCheckCircle, FiAlertCircle, FiInfo } from 'react-icons/fi'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  isVisible: boolean
  onClose: () => void
}

export function Toast({ message, type, isVisible, onClose }: ToastProps) {
  const icons = {
    success: <FiCheckCircle className="text-green-400" size={20} />,
    error: <FiAlertCircle className="text-red-400" size={20} />,
    info: <FiInfo className="text-blue-400" size={20} />
  }
  
  const colors = {
    success: 'bg-green-500/10 border-green-500/20',
    error: 'bg-red-500/10 border-red-500/20',
    info: 'bg-blue-500/10 border-blue-500/20'
  }
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl backdrop-blur-lg border ${colors[type]} shadow-xl`}>
            {icons[type]}
            <p className="text-sm text-white">{message}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}