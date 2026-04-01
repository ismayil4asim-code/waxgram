'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiMoreVertical, FiPhone, FiVideo, FiUser, FiCheck } from 'react-icons/fi'
import { Toast } from './Toast'
import { MessageInput } from './MessageInput'

interface ChatInterfaceProps {
  chatId?: string
  onBack?: () => void
  isMobile?: boolean
}

interface Message {
  id: string
  content: string
  sender_id: string
  time: string
  status: string
}

export function ChatInterface({ chatId, onBack, isMobile = false }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [chatName, setChatName] = useState('')
  const [chatUsername, setChatUsername] = useState('')
  const [chatAvatar, setChatAvatar] = useState<string | null>(null)
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' as 'success' | 'error' | 'info' })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000)
  }

  useEffect(() => {
    const tempUserId = localStorage.getItem('temp_user_id')
    if (!tempUserId) {
      window.location.href = '/auth'
      return
    }
    setUserId(tempUserId)

    // Данные для чатов
    const chatData: Record<string, { name: string; username: string; avatar: string | null }> = {
      '1': { 
        name: 'vaksek', 
        username: 'vaksek',
        avatar: 'https://i.ibb.co/zThS1F2P/photo-2026-03-29-10-46-46.jpg'
      },
      '2': { 
        name: 'Поддержка WaxGram', 
        username: 'waxgram_support',
        avatar: 'https://i.ibb.co/dsywjJ5Y/W.png'
      }
    }
    
    const currentChat = chatData[chatId || '1']
    if (currentChat) {
      setChatName(currentChat.name)
      setChatUsername(currentChat.username)
      setChatAvatar(currentChat.avatar)
    }

    // Сообщения
    if (chatId === '1') {
      setMessages([
        {
          id: '1',
          content: 'здарова пидарас',
          sender_id: 'other',
          time: '13:45',
          status: 'read'
        },
        {
          id: '2',
          content: 'Ну и хули, норм получилось',
          sender_id: 'other',
          time: '14:15',
          status: 'read'
        },
        {
          id: '3',
          content: 'отвечай давай',
          sender_id: 'other',
          time: '14:30',
          status: 'read'
        }
      ])
    } else if (chatId === '2') {
      setMessages([
        {
          id: '1',
          content: 'Здравствуйте! Чем можем помочь?',
          sender_id: 'other',
          time: '10:23',
          status: 'read'
        }
      ])
    }

    showToast('Подключено к защищенному чату', 'success')
  }, [chatId])

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return
    
    const newMessage: Message = {
      id: Date.now().toString(),
      content: text,
      sender_id: userId || 'me',
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    }
    
    setMessages(prev => [...prev, newMessage])
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1a] to-[#0a0a0a]">
      {/* Header */}
      <div className="glass px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <FiArrowLeft className="text-gray-400" size={20} />
            </button>
          )}
          
          <div className="relative">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#2b6bff] to-[#0055ff] flex items-center justify-center">
              {chatAvatar ? (
                <img src={chatAvatar} alt={chatName} className="w-full h-full object-cover" />
              ) : (
                <FiUser className="text-white" size={20} />
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
          </div>
          
          <div>
            <h1 className="font-semibold text-white">{chatName}</h1>
            <div className="flex items-center gap-1">
              <p className="text-xs text-gray-400">@{chatUsername}</p>
              <span className="text-xs text-gray-500">•</span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-xs text-gray-400">в сети</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <FiPhone className="text-gray-400" size={20} />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <FiVideo className="text-gray-400" size={20} />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <FiMoreVertical className="text-gray-400" size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {messages.map((message, index) => {
            const isOutgoing = message.sender_id === userId
            
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex mb-3 ${isOutgoing ? 'justify-end' : 'justify-start'}`}
              >
                {!isOutgoing && (
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[#2b6bff] to-[#0055ff] mr-2 flex-shrink-0">
                    {chatAvatar ? (
                      <img src={chatAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {chatName?.[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className={`max-w-[70%] ${isOutgoing ? 'bg-gradient-to-r from-[#2b6bff] to-[#0055ff] text-white rounded-2xl rounded-tr-sm' : 'bg-white/10 text-white rounded-2xl rounded-tl-sm'} px-4 py-2`}>
                  <p className="text-sm">{message.content}</p>
                  <div className={`text-xs mt-1 flex items-center gap-1 ${isOutgoing ? 'text-blue-200' : 'text-gray-400'}`}>
                    <span>{message.time}</span>
                    {isOutgoing && <FiCheck size={12} />}
                  </div>
                </div>
              </motion.div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="glass border-t border-white/10 p-4">
        <MessageInput onSendMessage={handleSendMessage} />
      </div>
      
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ show: false, message: '', type: 'info' })}
      />
    </div>
  )
}
