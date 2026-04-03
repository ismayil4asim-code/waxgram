'use client'

import { useState, useEffect, useCallback } from 'react'
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
  verified: boolean
  verified_type: string | null
  room_id?: string
}

interface ChatsListProps {
  onSelectChat: (chatId: string, roomId?: string) => void
}

function VerificationBadge({ type, size = 4 }: { type: string | null; size?: number }) {
  const src = type === 'developer' ? '/image-developer-192.png'
    : type === 'moderator' ? '/image-support-192.png'
    : '/image-192.png'
  const title = type === 'developer' ? 'Разработчик WaxGram'
    : type === 'moderator' ? 'Модератор WaxGram'
    : 'Подтвержденный пользователь'
  return <img src={src} alt={title} className={`w-${size} h-${size} ml-1 inline`} title={title} />
}

export function ChatsList({ onSelectChat }: ChatsListProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadChats = useCallback(async () => {
    const tempUserId = localStorage.getItem('temp_user_id')
    if (!tempUserId) { setLoading(false); return }

    try {
      // Параллельная загрузка текущего пользователя и комнат
      const [{ data: userData }, { data: rooms }] = await Promise.all([
        supabase.from('profiles').select('username, avatar_url, verified, verified_type').eq('id', tempUserId).single(),
        supabase.from('room_members').select('room_id').eq('user_id', tempUserId),
      ])

      if (userData) setCurrentUser(userData)
      if (!rooms || rooms.length === 0) { setChats([]); setLoading(false); return }

      const roomIds = rooms.map(r => r.room_id)

      // Параллельная загрузка сообщений и участников
      const [{ data: lastMessages }, { data: members }] = await Promise.all([
        supabase
          .from('messages')
          .select('room_id, content, created_at, sender_id, message_reads(user_id)')
          .in('room_id', roomIds)
          .order('created_at', { ascending: false }),
        supabase
          .from('room_members')
          .select('room_id, user_id, profiles:profiles!user_id(id, username, first_name, last_name, avatar_url, online, verified, verified_type)')
          .in('room_id', roomIds),
      ])

      // Последнее сообщение по комнате
      const latestByRoom: Record<string, any> = {}
      lastMessages?.forEach(msg => {
        if (!latestByRoom[msg.room_id]) {
          latestByRoom[msg.room_id] = {
            content: msg.content,
            created_at: msg.created_at,
            sender_id: msg.sender_id,
            read_by: msg.message_reads?.map((r: any) => r.user_id) || [],
          }
        }
      })

      const chatList: Chat[] = []
      for (const room of rooms) {
        const roomMembers = members?.filter(m => m.room_id === room.room_id) || []
        const other = roomMembers.find(m => m.user_id !== tempUserId)
        if (!other?.profiles) continue

        const profile = Array.isArray(other.profiles) ? other.profiles[0] : other.profiles
        if (!profile) continue

        const lastMsg = latestByRoom[room.room_id]
        const unread = (lastMsg && lastMsg.sender_id !== tempUserId && !lastMsg.read_by?.includes(tempUserId)) ? 1 : 0

        let displayName = profile.username || 'Пользователь'
        if (profile.first_name) {
          displayName = profile.last_name ? `${profile.first_name} ${profile.last_name}` : profile.first_name
        }

        chatList.push({
          id: other.user_id,
          room_id: room.room_id,
          name: displayName,
          username: profile.username || 'user',
          lastMessage: lastMsg?.content || 'Нет сообщений',
          time: lastMsg?.created_at
            ? new Date(lastMsg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
            : '',
          unread,
          avatar: profile.avatar_url || null,
          online: profile.online || false,
          verified: profile.verified || false,
          verified_type: profile.verified_type || null,
        })
      }

      chatList.sort((a, b) => {
        if (a.unread !== b.unread) return b.unread - a.unread
        return new Date(b.time).getTime() - new Date(a.time).getTime()
      })

      setChats(chatList)
    } catch (error) {
      console.error('Load chats error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadChats()

    const sub = supabase
      .channel('chats-list-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, loadChats)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_reads' }, loadChats)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, loadChats)
      .subscribe()

    return () => { sub.unsubscribe() }
  }, [loadChats])

  const handleAddContact = useCallback(async (newUser: any) => {
    const tempUserId = localStorage.getItem('temp_user_id')
    if (!tempUserId) return
    const res = await fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: tempUserId, contactId: newUser.id }),
    })
    const data = await res.json()
    if (data.success) await loadChats()
  }, [loadChats])

  const filteredChats = chats.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return <div className="flex items-center justify-center h-full"><FiLoader className="animate-spin text-[#2b6bff]" size={32} /></div>
  }

  return (
    <div className="h-full flex flex-col">
      <div className="glass px-4 py-3 safe-top">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {currentUser?.avatar_url
              ? <img src={currentUser.avatar_url} alt={currentUser.username} className="w-9 h-9 rounded-full object-cover" />
              : <div className="w-9 h-9 bg-gradient-to-br from-[#2b6bff] to-[#0055ff] rounded-full flex items-center justify-center"><FiUser className="text-white" size={18} /></div>
            }
            <div className="flex items-center">
              <h1 className="text-xl font-bold bg-gradient-to-r from-[#2b6bff] to-[#00c6ff] bg-clip-text text-transparent">WaxGram</h1>
              {currentUser?.verified && <VerificationBadge type={currentUser.verified_type} size={5} />}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Notifications />
            <SearchUser onAddContact={handleAddContact} />
          </div>
        </div>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Поиск чатов..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white placeholder-gray-500 text-base"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 pb-20">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 py-10 text-center">
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
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all mb-1 ${chat.unread > 0 ? 'bg-[#2b6bff]/10' : 'hover:bg-white/5'}`}
            >
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[#2b6bff] to-[#0055ff] flex items-center justify-center">
                  {chat.avatar ? <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" /> : <FiUser className="text-white" size={24} />}
                </div>
                {chat.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <h3 className={`font-semibold truncate ${chat.unread > 0 ? 'text-white' : 'text-gray-300'}`}>{chat.name}</h3>
                    {chat.verified && <VerificationBadge type={chat.verified_type} />}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{chat.time}</span>
                </div>
                <p className="text-xs text-gray-500">@{chat.username}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className={`text-sm truncate ${chat.unread > 0 ? 'text-white font-medium' : 'text-gray-400'}`}>{chat.lastMessage}</p>
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
