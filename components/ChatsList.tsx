'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiSearch, FiUser } from 'react-icons/fi'
import { SearchUser } from './SearchUser'
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

  useEffect(() => {
    const loadChats = async () => {
      const tempUserId = localStorage.getItem('temp_user_id')
      if (!tempUserId) return
      
      // Загружаем текущего пользователя
      const { data: userData } = await supabase
        .from('profiles')
        .select('username, avatar_url')
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
      
      if (rooms && rooms.length > 0) {
        const roomIds = rooms.map(r => r.room_id)
        
        // Загружаем последние сообщения
        const { data: lastMessages } = await supabase
          .from('messages')
          .select('room_id, content, created_at, sender_id')
          .in('room_id', roomIds)
          .order('created_at', { ascending: false })
        
        // Загружаем участников комнат
        const { data: members } = await supabase
          .from('room_members')
          .select('room_id, user_id, profiles(username, avatar_url)')
          .in('room_id', roomIds)
        
        // Формируем список чатов
        const chatList: Chat[] = []
        
        for (const room of rooms) {
          const roomMembers = members?.filter(m => m.room_id === room.room_id) || []
          const otherUser = roomMembers.find(m => m.user_id !== tempUserId)
          const lastMsg = lastMessages?.find(m => m.room_id === room.room_id)
          
          if (otherUser?.profiles) {
            chatList.push({
              id: otherUser.user_id,
              room_id: room.room_id,
              name: otherUser.profiles.username || 'Пользователь',
              username: otherUser.profiles.username || 'user',
              lastMessage: lastMsg?.content || 'Нет сообщений',
              time: lastMsg?.created_at ? new Date(lastMsg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '',
              unread: 0,
              avatar: otherUser.profiles.avatar_url,
              online: false
            })
          }
        }
        
        setChats(chatList)
      }
      
      setLoading(false)
    }
    
    loadChats()
    
    // Подписка на новые сообщения
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        // Обновляем список чатов
        loadChats()
      })
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleAddContact = async (newUser: any) => {
    const tempUserId = localStorage.getItem('temp_user_id')
    
    if (!tempUserId) return
    
    // Создаем комнату для чата
    const response = await fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: tempUserId, contactId: newUser.id })
    })
    
    const data = await response.json()
    
    if (data.success) {
      // Добавляем в локальный список
      const newChat: Chat = {
        id: newUser.id,
        room_id: data.roomId,
        name: newUser.username,
        username: newUser.username,
        lastMessage: 'Новый контакт добавлен',
        time: 'только что',
        unread: 1,
        avatar: newUser.avatar,
        online: false
      }
      
      setChats(prev => [newChat, ...prev])
    }
  }

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="glass px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {currentUser?.avatar_url ? (
              <img src={currentUser.avatar_url} alt={currentUser.username} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-[#2b6bff] to-[#0055ff] rounded-full flex items-center justify-center">
                <FiUser className="text-white" size={20} />
              </div>
            )}
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#2b6bff] to-[#00c6ff] bg-clip-text text-transparent">
              WaxGram
            </h1>
          </div>
          <SearchUser onAddContact={handleAddContact} />
        </div>
        
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск сообщений или пользователей..."
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white placeholder-gray-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {filteredChats.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            <p>Нет чатов</p>
            <p className="text-sm mt-2">Найдите пользователя через поиск</p>
          </div>
        ) : (
          filteredChats.map((chat, index) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => onSelectChat(chat.id, chat.room_id)}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-all group"
            >
              <div className="relative">
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
                    <h3 className="font-semibold text-white">{chat.name}</h3>
                    <p className="text-xs text-gray-500">@{chat.username}</p>
                  </div>
                  <span className="text-xs text-gray-400">{chat.time}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-gray-400 truncate">{chat.lastMessage}</p>
                  {chat.unread > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-[#2b6bff] text-white text-xs rounded-full">
                      {chat.unread}
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
