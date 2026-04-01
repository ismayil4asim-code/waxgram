'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowLeft, FiMoreVertical, FiPhone, FiVideo, FiUser, FiCheck } from 'react-icons/fi'
import { supabase } from '@/lib/supabase/client'
import { Toast } from './Toast'
import { MessageInput } from './MessageInput'

interface ChatInterfaceProps {
  chatId?: string
  roomId?: string
  onBack?: () => void
  isMobile?: boolean
}

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
}

export function ChatInterface({ chatId, roomId: initialRoomId, onBack, isMobile = false }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [roomId, setRoomId] = useState<string | null>(initialRoomId || null)
  const [chatName, setChatName] = useState('')
  const [chatUsername, setChatUsername] = useState('')
  const [chatAvatar, setChatAvatar] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' as 'success' | 'error' | 'info' })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000)
  }

  useEffect(() => {
    const initChat = async () => {
      const tempUserId = localStorage.getItem('temp_user_id')
      if (!tempUserId) {
        window.location.href = '/auth'
        return
      }
      setUserId(tempUserId)
      
      // Загружаем информацию о собеседнике
      const { data: contactData } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', chatId)
        .single()
      
      if (contactData) {
        setChatName(contactData.username || 'Пользователь')
        setChatUsername(contactData.username || 'user')
        setChatAvatar(contactData.avatar_url)
      }
      
      // Если нет roomId, создаем или получаем
      if (!roomId && chatId) {
        const response = await fetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: tempUserId, contactId: chatId })
        })
        
        const data = await response.json()
        if (data.success) {
          setRoomId(data.roomId)
        }
      }
      
      setLoading(false)
    }
    
    initChat()
  }, [chatId, roomId])

  // Загрузка сообщений
  useEffect(() => {
    if (!roomId) return
    
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
      
      if (!error && data) {
        setMessages(data)
      }
    }
    
    loadMessages()
    
    // Подписка на новые сообщения
    const subscription = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      })
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [roomId])

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !roomId || !userId) return
    
    const { error } = await supabase
      .from('messages')
      .insert({
        room_id: roomId,
        sender_id: userId,
        content: text,
        message_type: 'text'
      })
    
    if (error) {
      console.error('Send error:', error)
      showToast('Ошибка отправки сообщения', 'error')
    }
  }

  const formatTime = (date: string) => {
    const d = new Date(date)
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner"></div>
      </div>
    )
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
                    <span>{formatTime(message.created_at)}</span>
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
