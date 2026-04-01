'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowLeft, FiMoreVertical, FiPhone, FiVideo, FiUser, FiCheck, FiTrash2, FiInfo } from 'react-icons/fi'
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
  deleted?: boolean
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
  const [showDeleteMenu, setShowDeleteMenu] = useState<string | null>(null)
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
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', chatId)
        .single()
      
      if (profileData) {
        setProfile(profileData)
      }
      
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

  const loadMessages = async () => {
    if (!roomId) return
    
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

  useEffect(() => {
    if (!roomId) return
    
    loadMessages()
    
    const subscription = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        const newMessage = payload.new as Message
        setMessages(prev => [...prev, newMessage])
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        const updated = payload.new as Message
        setMessages(prev => prev.map(msg => msg.id === updated.id ? updated : msg))
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'message_reads',
      }, () => {
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

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ deleted: true, content: 'Сообщение удалено' })
        .eq('id', messageId)
      
      if (error) throw error
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: 'Сообщение удалено', deleted: true }
          : msg
      ))
      
      showToast('Сообщение удалено', 'success')
      setShowDeleteMenu(null)
    } catch (error) {
      console.error('Delete error:', error)
      showToast('Ошибка удаления', 'error')
    }
  }

  const getVerificationBadge = () => {
    if (!profile?.verified) return null
    
    if (profile.verified_type === 'developer') {
      return (
        <img 
          src="/image-developer-192.png" 
          alt="Developer" 
          className="w-4 h-4 ml-1"
          title="Разработчик WaxGram"
        />
      )
    }
    
    if (profile.verified_type === 'moderator') {
      return (
        <img 
          src="/image-support-192.png" 
          alt="Moderator" 
          className="w-4 h-4 ml-1"
          title="Модератор WaxGram"
        />
      )
    }
    
    return (
      <img 
        src="/image-192.png" 
        alt="Verified" 
        className="w-4 h-4 ml-1"
        title="Подтвержденный пользователь"
      />
    )
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
              <div className="flex items-center">
                <h1 className="font-semibold text-white">{profile?.username || 'Пользователь'}</h1>
                {getVerificationBadge()}
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
                className={`flex mb-3 ${isOutgoing ? 'justify-end' : 'justify-start'} group`}
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
                
                <div className={`max-w-[70%] ${isOutgoing ? 'bg-gradient-to-r from-[#2b6bff] to-[#0055ff] text-white rounded-2xl rounded-tr-sm' : 'bg-white/10 text-white rounded-2xl rounded-tl-sm'} px-4 py-2 relative`}>
                  <p className={`text-sm ${message.deleted ? 'italic text-gray-400' : ''}`}>
                    {message.content}
                  </p>
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
                  
                  {isOutgoing && !message.deleted && (
                    <div className="absolute -right-8 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="relative">
                        <button
                          onClick={() => setShowDeleteMenu(showDeleteMenu === message.id ? null : message.id)}
                          className="p-1 hover:bg-white/10 rounded-full transition-colors"
                        >
                          <FiTrash2 size={14} className="text-gray-400 hover:text-red-400" />
                        </button>
                        {showDeleteMenu === message.id && (
                          <div className="absolute right-0 top-full mt-1 bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10 w-32">
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-white/10 transition-colors"
                            >
                              Удалить для всех
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="glass border-t border-white/10 p-3 safe-bottom">
        <MessageInput onSendMessage={handleSendMessage} />
      </div>
      
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
