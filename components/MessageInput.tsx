'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSend, FiMic, FiSmile, FiPaperclip } from 'react-icons/fi'

interface MessageInputProps {
  onSendMessage: (message: string) => void
}

export function MessageInput({ onSendMessage }: MessageInputProps) {
  const [message, setMessage] = useState('')

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message)
      setMessage('')
    }
  }

  return (
    <div className="flex items-center gap-2 bg-white/5 rounded-full p-1 pl-4 border border-white/10">
      <button className="text-gray-400 hover:text-[#2b6bff] transition-colors">
        <FiPaperclip size={20} />
      </button>
      <button className="text-gray-400 hover:text-[#2b6bff] transition-colors">
        <FiSmile size={20} />
      </button>
      
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        placeholder="Напишите сообщение..."
        className="flex-1 py-3 bg-transparent focus:outline-none text-white placeholder-gray-500"
      />
      
      <AnimatePresence mode="wait">
        {message.trim() ? (
          <motion.button
            key="send"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            className="w-10 h-10 bg-gradient-to-r from-[#2b6bff] to-[#0055ff] text-white rounded-full flex items-center justify-center"
          >
            <FiSend size={18} />
          </motion.button>
        ) : (
          <motion.button
            key="mic"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="w-10 h-10 text-gray-400 rounded-full flex items-center justify-center"
          >
            <FiMic size={20} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}