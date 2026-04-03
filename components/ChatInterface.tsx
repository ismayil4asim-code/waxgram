'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowLeft, FiMoreVertical, FiPhone, FiVideo, FiUser, FiCheck, FiTrash2 } from 'react-icons/fi'
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
  // Храним userId в ref для использования в замыканиях подписок
  const userIdRef = useRef<string | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000)
  }, [])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const init = async () => {
      const tempUserId = localStorage.getItem('temp_user_id')
      if (!tempUserId) {
        window.location.replace('/auth')
        return
      }
      setUserId(tempUserId)
      userIdRef.current = tempUserId

      const [{ data: profileData }, roomData] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', chatId).single(),
        !initialRoomId && chatId
          ? fetch('/api/chats', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: tempUserId, contactId: chatId }),
            }).then(r => r.json())
          : Promise.resolve(null),
      ])

      if (profileData) setProfile(profileData)
      if (roomData?.success) setRoomId(roomData.roomId)

      setLoading(false)
    }
    init()
  }, [chatId, initialRoomId])

  // Загрузка сообщений + отметка прочитанных
  const loadMessages = useCallback(async (currentRoomId: string, currentUserId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*, message_reads(user_id)')
      .eq('room_id', currentRoomId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      const formatted = data.map(msg => ({
        ...msg,
        read_by: msg.message_reads?.map((r: any) => r.user_id) || [],
      }))
      setMessages(formatted)

      // Отмечаем непрочитанные одним batch-запросом
      const unread = formatted.filter(
        msg => msg.sender_id === chatId && !(msg.read_by ?? []).includes(currentUserId)
      )
      if (unread.length > 0) {
        await supabase.from('message_reads').insert(
          unread.map(msg => ({ message_id: msg.id, user_id: currentUserId }))
        )
      }
    }
  }, [chatId])

  useEffect(() => {
    if (!roomId || !userId) return

    loadMessages(roomId, userId)

    const subscription = supabase
      .channel(`chat:${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        const newMsg = payload.new as Message
        setMessages(prev => {
          // Заменяем оптимистичное сообщение реальным
          const tempIdx = prev.findIndex(
            m => m.id.startsWith('temp-') && m.content === newMsg.content && m.sender_id === newMsg.sender_id
          )
          if (tempIdx !== -1) {
            const next = [...prev]
            next[tempIdx] = { ...newMsg, read_by: [] }
            return next
          }
          return [...prev, { ...newMsg, read_by: [] }]
        })
        setTimeout(scrollToBottom, 100)
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        const updated = payload.new as Message
        setMessages(prev => prev.map(m => m.id === updated.id ? { ...updated, read_by: m.read_by } : m))
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'message_reads',
      }, () => {
        if (roomId && userIdRef.current) loadMessages(roomId, userIdRef.current)
      })
      .subscribe()

    return () => { subscription.unsubscribe() }
  }, [roomId, userId, loadMessages, scrollToBottom])

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !roomId || !userId) return

    const tempId = `temp-${Date.now()}`
    const optimistic: Message = {
      id: tempId,
      content: text,
      sender_id: userId,
      created_at: new Date().toISOString(),
      deleted: false,
      read_by: [],
    }
    setMessages(prev => [...prev, optimistic])
    setTimeout(scrollToBottom, 50)

    const { data, error } = await supabase
      .from('messages')
      .insert({ room_id: roomId, sender_id: userId, content: text, message_type: 'text' })
      .select()
      .single()

    if (error) {
      showToast('Ошибка отправки сообщения', 'error')
      setMessages(prev => prev.filter(m => m.id !== tempId))
    } else if (data) {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...data, read_by: [] } : m))
    }
  }, [roomId, userId, scrollToBottom, showToast])

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    const { error } = await supabase
      .from('messages')
      .update({ deleted: true, content: 'Сообщение удалено' })
      .eq('id', messageId)

    if (error) {
      showToast('Ошибка удаления', 'error')
      return
    }
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, content: 'Сообщение удалено', deleted: true } : m
    ))
    showToast('Сообщение удалено', 'success')
    setShowDeleteMenu(null)
  }, [showToast])

  const getVerificationBadge = () => {
    if (!profile?.verified) return null
    const src = profile.verified_type === 'developer' ? '/image-developer-192.png'
      : profile.verified_type === 'moderator' ? '/image-support-192.png'
      : '/image-192.png'
    const title = profile.verified_type === 'developer' ? 'Разработчик WaxGram'
      : profile.verified_type === 'moderator' ? 'Модератор WaxGram'
      : 'Подтвержденный пользователь'
    return <img src={src} alt={title} className="w-4 h-4 ml-1" title={title} />
  }

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  const isMessageRead = (message: Message) =>
    message.sender_id === userId && (message.read_by?.length ?? 0) > 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-[#2b6bff] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1a] to-[#0a0a0a]">
      {/* Шапка */}
      <div className="glass px-4 py-3 flex items-center justify-between safe-top">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-95">
              <FiArrowLeft className="text-gray-400" size={20} />
            </button>
          )}
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#2b6bff] to-[#0055ff]">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><FiUser className="text-white" size={20} /></div>
                }
              </div>
              {profile?.online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
              )}
            </div>
            <div className="text-left">
              <div className="flex items-center">
                <h1 className="font-semibold text-white">{profile?.username || 'Пользователь'}</h1>
                {getVerificationBadge()}
              </div>
              <p className="text-xs text-gray-400">
                {profile?.online ? 'в сети' : profile?.last_seen
                  ? `был(а) ${new Date(profile.last_seen).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
                  : 'не в сети'}
              </p>
            </div>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><FiPhone className="text-gray-400" size={20} /></button>
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><FiVideo className="text-gray-400" size={20} /></button>
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><FiMoreVertical className="text-gray-400" size={20} /></button>
        </div>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {messages.map((message, index) => {
            const isOutgoing = message.sender_id === userId
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.02, 0.3) }}
                className={`flex mb-3 ${isOutgoing ? 'justify-end' : 'justify-start'} group`}
              >
                {!isOutgoing && (
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[#2b6bff] to-[#0055ff] mr-2 flex-shrink-0">
                    {profile?.avatar_url
                      ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><span className="text-white text-xs font-bold">{profile?.username?.[0]?.toUpperCase() || 'U'}</span></div>
                    }
                  </div>
                )}
                <div className={`max-w-[70%] ${isOutgoing ? 'bg-gradient-to-r from-[#2b6bff] to-[#0055ff] text-white rounded-2xl rounded-tr-sm' : 'bg-white/10 text-white rounded-2xl rounded-tl-sm'} px-4 py-2 relative`}>
                  <p className={`text-sm ${message.deleted ? 'italic text-gray-400' : ''}`}>{message.content}</p>
                  <div className={`text-xs mt-1 flex items-center gap-1 ${isOutgoing ? 'text-blue-200' : 'text-gray-400'}`}>
                    <span>{formatTime(message.created_at)}</span>
                    {isOutgoing && (isMessageRead(message) ? <span className="text-blue-300">✓✓</span> : <FiCheck size={12} />)}
                  </div>
                  {isOutgoing && !message.deleted && (
                    <div className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="relative">
                        <button
                          onClick={() => setShowDeleteMenu(showDeleteMenu === message.id ? null : message.id)}
                          className="p-1 hover:bg-white/10 rounded-full transition-colors"
                        >
                          <FiTrash2 size={14} className="text-gray-400 hover:text-red-400" />
                        </button>
                        {showDeleteMenu === message.id && (
                          <div className="absolute right-0 top-full mt-1 bg-gray-800 rounded-lg shadow-lg z-10 w-36">
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

      {/* Ввод */}
      <div className="glass border-t border-white/10 p-3 safe-bottom">
        <MessageInput onSendMessage={handleSendMessage} />
      </div>

      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} userId={chatId} />
      <Toast message={toast.message} type={toast.type} isVisible={toast.show} onClose={() => setToast({ show: false, message: '', type: 'info' })} />
    </div>
  )
}
