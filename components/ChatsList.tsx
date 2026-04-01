'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiSearch, FiUser, FiLoader, FiUsers } from 'react-icons/fi'
import { SearchUser } from './SearchUser'
import { Notifications } from './Notifications'
import { supabase } from '@/lib/supabase/client'

interface Chat {
  id: string
  name: string
  username: string
  lastMessage: string
  time: string
  unread: number
  avatar: string | null
  online: boolean
  room_id?: string
}

interface ChatsListProps {
  onSelectChat: (chatId: string, roomId?: string) => void
}

export function ChatsList({ onSelectChat }: ChatsListProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadChats = async () => {
    const tempUserId = localStorage.getItem('temp_user_id')
    if (!tempUserId) {
      setLoading(false)
      return
    }
    
    try {
      // Загружаем текущего пользователя
      const { data: userData } = await supabase
        .from('profiles')
        .select('username, avatar_url, verified, verified_type')
        .eq('id', tempUserId)
        .single()
      
      if (userData) {
        setCurrentUser(userData)
      }
      
      // Загружаем комнаты пользователя
      const { data: rooms } = await supabase
        .from('room_members')
        .select('room_id')
        .eq('user_id', tempUserId)
      
      if (!rooms || rooms.length === 0) {
        setChats([])
        setLoading(false)
        return
      }
      
      const roomIds = rooms.map(r => r.room_id)
      
      // Загружаем последние сообщения
      const { data: lastMessages } = await supabase
        .from('messages')
        .select(`
          room_id, 
          content, 
          created_at,
          sender_id,
          message_reads (user_id)
        `)
        .in('room_id', roomIds)
        .order('created_at', { ascending: false })
      
      // Группируем последние сообщения по комнатам
      const latestMessagesByRoom: Record<string, any> = {}
      lastMessages?.forEach(msg => {
        if (!latestMessagesByRoom[msg.room_id]) {
          latestMessagesByRoom[msg.room_id] = {
            content: msg.content,
            created_at: msg.created_at,
            sender_id: msg.sender_id,
            read_by: msg.message_reads?.map((r: any) => r.user_id) || []
          }
        }
      })
      
      // Загружаем участников комнат
      const { data: members } = await supabase
        .from('room_members')
        .select(`
          room_id,
          user_id,
          profiles:profiles!user_id (
            id,
            username,
            avatar_url,
            online
          )
        `)
        .in('room_id', roomIds)
      
      const chatList: Chat[] = []
      
      for (const room of rooms) {
        const roomMembers = members?.filter(m => m.room_id === room.room_id) || []
        const otherUser = roomMembers.find(m => m.user_id !== tempUserId)
        
        if (otherUser?.profiles) {
          const profile = Array.isArray(otherUser.profiles) ? otherUser.profiles[0] : otherUser.profiles
          const lastMsg = latestMessagesByRoom[room.room_id]
          
          if (profile) {
            // Проверяем, прочитано ли сообщение
            let unread = 0
            if (lastMsg && lastMsg.sender_id !== tempUserId) {
              const isRead = lastMsg.read_by?.includes(tempUserId)
              if (!isRead) {
                unread = 1
              }
            }
            
            chatList.push({
              id: otherUser.user_id,
              room_id: room.room_id,
              name: profile.username || 'Пользователь',
              username: profile.username || 'user',
              lastMessage: lastMsg?.content || 'Нет сообщений',
              time: lastMsg?.created_at ? new Date(lastMsg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '',
              unread: unread,
              avatar: profile.avatar_url || null,
              online: profile.online || false
            })
          }
        }
      }
      
      // Сортируем чаты: сначала с непрочитанными, затем по времени последнего сообщения
      chatList.sort((a, b) => {
        if (a.unread > 0 && b.unread === 0) return -1
        if (a.unread === 0 && b.unread > 0) return 1
        
        const timeA = new Date(a.time).getTime()
        const timeB = new Date(b.time).getTime()
        return timeB - timeA
      })
      
      setChats(chatList)
    } catch (error) {
      console.error('Load chats error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadChats()
    
    const messagesSubscription = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        loadChats()
      })
      .subscribe()
    
    const readsSubscription = supabase
      .channel('message-reads')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_reads' }, () => {
        loadChats()
      })
      .subscribe()
    
    const profileSubscription = supabase
      .channel('profiles')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, () => {
        loadChats()
      })
      .subscribe()
    
    return () => {
      messagesSubscription.unsubscribe()
      readsSubscription.unsubscribe()
      profileSubscription.unsubscribe()
    }
  }, [])

  const handleAddContact = async (newUser: any) => {
    const tempUserId = localStorage.getItem('temp_user_id')
    if (!tempUserId) return
    
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: tempUserId, contactId: newUser.id })
      })
      
      const data = await response.json()
      
      if (data.success) {
        await loadChats()
      }
    } catch (error) {
      console.error('Add contact error:', error)
      throw error
    }
  }

  const getVerificationBadge = () => {
    if (!currentUser?.verified) return null
    
    if (currentUser.verified_type === 'developer') {
      return (
        <div className="relative">
          <img src="/image-developer-192.png" alt="Developer" className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 text-[10px]">⚡</span>
        </div>
      )
    }
    
    if (currentUser.verified_type === 'moderator') {
      return (
        <div className="relative">
          <img src="/image-support-192.png" alt="Moderator" className="w-5 h-5" />
        </div>
      )
    }
    
    return (
      <img src="/image-192.png" alt="Verified" className="w-5 h-5" />
    )
  }

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <FiLoader className="animate-spin text-[#2b6bff]" size={32} />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="glass px-4 py-3 safe-top">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {currentUser?.avatar_url ? (
              <img src={currentUser.avatar_url} alt={currentUser.username} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 bg-gradient-to-br from-[#2b6bff] to-[#0055ff] rounded-full flex items-center justify-center">
                <FiUser className="text-white" size={18} />
              </div>
            )}
            <div className="flex items-center gap-1">
              <h1 className="text-xl font-bold bg-gradient-to-r from-[#2b6bff] to-[#00c6ff] bg-clip-text text-transparent">
                WaxGram
              </h1>
              {getVerificationBadge()}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Notifications />
            <SearchUser onAddContact={handleAddContact} />
          </div>
        </div>
        
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск чатов..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white placeholder-gray-500 text-base"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 pb-20">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-10">
            <FiUsers size={48} className="mb-3 opacity-50" />
            <p>Нет чатов</p>
            <p className="text-sm mt-2">Нажмите на кнопку + вверху,<br />чтобы найти пользователя</p>
          </div>
        ) : (
          filteredChats.map((chat, index) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.03, 0.3) }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectChat(chat.id, chat.room_id)}
              className={`flex items-center gap-3 p-3 rounded-xl active:bg-white/5 cursor-pointer transition-all mb-1 ${
                chat.unread > 0 ? 'bg-[#2b6bff]/10' : ''
              }`}
            >
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[#2b6bff] to-[#0055ff] flex items-center justify-center">
                  {chat.avatar ? (
                    <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
                  ) : (
                    <FiUser className="text-white" size={24} />
                  )}
                </div>
                {chat.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`font-semibold truncate ${chat.unread > 0 ? 'text-white' : 'text-gray-300'}`}>
                      {chat.name}
                    </h3>
                    <p className="text-xs text-gray-500">@{chat.username}</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{chat.time}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className={`text-sm truncate ${chat.unread > 0 ? 'text-white font-medium' : 'text-gray-400'}`}>
                    {chat.lastMessage}
                  </p>
                  {chat.unread > 0 && (
                    <span className="ml-2 w-5 h-5 bg-[#2b6bff] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">{chat.unread}</span>
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
