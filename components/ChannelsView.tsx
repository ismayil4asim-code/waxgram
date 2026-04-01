'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiSearch, FiPlus, FiUsers, FiLoader, FiUser } from 'react-icons/fi'
import { supabase } from '@/lib/supabase/client'

interface Channel {
  id: string
  name: string
  description: string
  subscribers: number
  avatar: string | null
  isOwner: boolean
  owner_id?: string
  owner_name?: string
  created_at?: string
}

interface ChannelsViewProps {
  onCreateChannel: () => void
  onSelectChannel: (channelId: string) => void
}

export function ChannelsView({ onCreateChannel, onSelectChannel }: ChannelsViewProps) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const loadChannels = async () => {
    const userId = localStorage.getItem('temp_user_id')
    setCurrentUserId(userId)
    
    try {
      // Загружаем каналы из localStorage (в будущем из Supabase)
      const savedChannels = localStorage.getItem('channels')
      if (savedChannels) {
        setChannels(JSON.parse(savedChannels))
      } else {
        const defaultChannels: Channel[] = [
          {
            id: '1',
            name: 'WaxGram Official',
            description: 'Официальный канал WaxGram. Новости и обновления',
            subscribers: 128,
            avatar: 'https://i.ibb.co/dsywjJ5Y/W.png',
            isOwner: false,
            owner_id: 'system',
            owner_name: 'WaxGram'
          }
        ]
        setChannels(defaultChannels)
        localStorage.setItem('channels', JSON.stringify(defaultChannels))
      }
    } catch (error) {
      console.error('Load channels error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadChannels()
  }, [])

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    channel.description.toLowerCase().includes(searchQuery.toLowerCase())
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
      {/* Header */}
      <div className="glass px-4 py-3 safe-top">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-[#2b6bff] to-[#0055ff] rounded-full flex items-center justify-center">
              <FiUsers className="text-white" size={18} />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-[#2b6bff] to-[#00c6ff] bg-clip-text text-transparent">
              Каналы
            </h1>
          </div>
          <button
            onClick={onCreateChannel}
            className="p-2 bg-gradient-to-r from-[#2b6bff] to-[#0055ff] rounded-full hover:opacity-90 transition-colors"
          >
            <FiPlus size={20} className="text-white" />
          </button>
        </div>
        
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск каналов..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white placeholder-gray-500 text-base"
          />
        </div>
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 pb-20">
        {filteredChannels.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-10">
            <FiUsers size={48} className="mb-3 opacity-50" />
            <p>Нет каналов</p>
            <p className="text-sm mt-2">Нажмите на кнопку + вверху,<br />чтобы создать канал</p>
          </div>
        ) : (
          filteredChannels.map((channel, index) => (
            <motion.div
              key={channel.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.03, 0.3) }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectChannel(channel.id)}
              className="flex items-center gap-3 p-3 rounded-xl active:bg-white/5 cursor-pointer transition-all mb-1"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[#2b6bff] to-[#0055ff] flex items-center justify-center flex-shrink-0">
                {channel.avatar ? (
                  <img src={channel.avatar} alt={channel.name} className="w-full h-full object-cover" />
                ) : (
                  <FiUsers className="text-white" size={24} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white truncate text-base">{channel.name}</h3>
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{channel.subscribers} подп.</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {channel.isOwner ? 'Ваш канал' : `@${channel.owner_name || 'автор'}`}
                </p>
                <p className="text-sm text-gray-400 truncate mt-1">{channel.description}</p>
              </div>
              
              {channel.isOwner && (
                <div className="px-2 py-1 bg-[#2b6bff]/20 rounded-full">
                  <span className="text-xs text-[#2b6bff]">Админ</span>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
