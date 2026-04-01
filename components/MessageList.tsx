'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { FiCheck } from 'react-icons/fi'

interface Message {
  id: string
  encrypted_content: string
  sender_id: string
  message_type: string
  file_url?: string
  sent_at: string
}

interface MessageListProps {
  messages: Message[]
  userId: string | null
}

export function MessageList({ messages, userId }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const formatTime = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    
    if (isToday) {
      return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-center mb-6">
        <div className="bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full">
          <p className="text-xs text-gray-400">Сегодня</p>
        </div>
      </div>
      
      {messages.map((message, index) => {
        const isOutgoing = message.sender_id === userId
        const isDemo = message.sender_id === 'demo_user'
        
        return (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.05, type: "spring", stiffness: 500, damping: 30 }}
            className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} animate-message-in`}
          >
            {!isOutgoing && (
              <div className="w-9 h-9 bg-gradient-to-br from-[#2b6bff] to-[#00c6ff] rounded-full flex items-center justify-center text-xs font-bold text-white mr-2 flex-shrink-0 shadow-lg">
                {isDemo ? 'W' : 'U'}
              </div>
            )}
            
            <div
              className={`message-bubble ${
                isOutgoing
                  ? 'message-bubble-outgoing'
                  : 'message-bubble-incoming'
              } relative group`}
            >
              {message.message_type === 'text' && (
                <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                  {message.encrypted_content}
                </p>
              )}
              
              {message.message_type === 'image' && message.file_url && (
                <motion.img
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  src={message.file_url}
                  alt="Image"
                  className="max-w-[250px] rounded-lg cursor-pointer"
                />
              )}
              
              {message.message_type === 'voice' && message.file_url && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                    </svg>
                  </div>
                  <audio controls className="max-w-[200px] h-8">
                    <source src={message.file_url} type="audio/webm" />
                  </audio>
                </div>
              )}
              
              <div className={`text-[11px] mt-1 flex items-center gap-1 ${
                isOutgoing ? 'text-blue-200' : 'text-gray-400'
              }`}>
                <span>{formatTime(message.sent_at)}</span>
                {isOutgoing && (
                  <span className="flex items-center">
                    <FiCheck className="text-xs" />
                  </span>
                )}
              </div>
              
              <div className="absolute -top-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button className="bg-gray-800 text-white text-xs px-3 py-1 rounded-full shadow-lg hover:bg-gray-700 transition-colors">
                  Ответить
                </button>
              </div>
            </div>
            
            {isOutgoing && (
              <div className="w-9 h-9 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-white ml-2 flex-shrink-0 shadow-lg">
                {message.encrypted_content.includes('😊') ? '😊' : 'Вы'}
              </div>
            )}
          </motion.div>
        )
      })}
      <div ref={messagesEndRef} />
    </div>
  )
}
