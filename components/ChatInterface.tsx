'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowLeft, FiMoreVertical, FiPhone, FiVideo, FiUser, FiCheck, FiInfo } from 'react-icons/fi'
import { supabase } from '@/lib/supabase/client'
import { Toast } from './Toast'
import { MessageInput } from './MessageInput'
import { ProfileModal } from './ProfileModal'

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
  read_by?: string[]
}

interface Profile {
  id: string
  username: string
  avatar_url: string | null
  bio: string
  verified: boolean
  verified_type: string | null
  online: boolean
  last_seen: string
}

export function ChatInterface({ chatId, roomId: initialRoomId, onBack, isMobile = false }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [roomId, setRoomId] = useState<string | null>(initialRoomId || null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showProfileModal, setShowProfileModal] = useState(false)
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
      
      // Загружаем профиль собеседника
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', chatId)
        .single()
      
      if (profileData) {
        setProfile(profileData)
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

  // Загрузка сообщений с отметками о прочтении
  useEffect(() => {
    if (!roomId) return
    
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          message_reads (user_id)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
      
      if (!error && data) {
        const formattedMessages = data.map(msg => ({
          ...msg,
          read_by: msg.message_reads?.map((r: any) => r.user_id) || []
        }))
        setMessages(formattedMessages)
        
        // Отмечаем как прочитанные сообщения от собеседника
        const unreadMessages = formattedMessages.filter(
          msg => msg.sender_id === chatId && !msg.read_by?.includes(userId)
        )
        
        for (const msg of unreadMessages) {
          await supabase
            .from('message_reads')
            .insert({
              message_id: msg.id,
              user_id: userId
            })
        }
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
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'message_reads',
      }, () => {
        // Обновляем статусы прочтения
        loadMessages()
      })
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [roomId, userId, chatId])

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

  const isMessageRead = (message: Message) => {
    if (message.sender_id !== userId) return false
    return message.read_by?.length > 0
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
      <div className="glass px-4 py-3 flex items-center justify-between safe-top">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-95"
            >
              <FiArrowLeft className="text-gray-400" size={20} />
            </button>
          )}
          
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#2b6bff] to-[#0055ff]">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FiUser className="text-white" size={20} />
                  </div>
                )}
              </div>
              {profile?.online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
              )}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1">
                <h1 className="font-semibold text-white">{profile?.username || 'Пользователь'}</h1>
                {profile?.verified && (
                  <span className={`text-xs ${profile.verified_type === 'developer' ? 'text-purple-400' : 'text-[#2b6bff]'}`}>
                    {profile.verified_type === 'developer' ? '⚡' : '✓'}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                {profile?.online ? 'в сети' : profile?.last_seen ? `был(а) ${new Date(profile.last_seen).toLocaleTimeString()}` : 'не в сети'}
              </p>
            </div>
          </button>
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
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {messages.map((message, index) => {
            const isOutgoing = message.sender_id === userId
            
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.5) }}
                className={`flex mb-3 ${isOutgoing ? 'justify-end' : 'justify-start'}`}
              >
                {!isOutgoing && (
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[#2b6bff] to-[#0055ff] mr-2 flex-shrink-0">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {profile?.username?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className={`max-w-[70%] ${isOutgoing ? 'bg-gradient-to-r from-[#2b6bff] to-[#0055ff] text-white rounded-2xl rounded-tr-sm' : 'bg-white/10 text-white rounded-2xl rounded-tl-sm'} px-4 py-2`}>
                  <p className="text-sm">{message.content}</p>
                  <div className={`text-xs mt-1 flex items-center gap-1 ${isOutgoing ? 'text-blue-200' : 'text-gray-400'}`}>
                    <span>{formatTime(message.created_at)}</span>
                    {isOutgoing && (
                      isMessageRead(message) ? (
                        <span className="text-blue-300">✓✓</span>
                      ) : (
                        <FiCheck size={12} />
                      )
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="glass border-t border-white/10 p-3 safe-bottom">
        <MessageInput onSendMessage={handleSendMessage} />
      </div>
      
      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userId={chatId}
      />
      
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ show: false, message: '', type: 'info' })}
      />
    </div>
  )
}
