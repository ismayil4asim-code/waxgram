'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiSearch, FiPlus, FiUsers } from 'react-icons/fi'

interface Channel {
  id: string
  name: string
  description: string
  subscribers: number
  avatar: string | null
  isOwner: boolean
  lastPost?: string
}

interface ChannelsViewProps {
  onCreateChannel: () => void
  onSelectChannel: (channelId: string) => void
}

export function ChannelsView({ onCreateChannel, onSelectChannel }: ChannelsViewProps) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
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
          isOwner: true,
          lastPost: 'Добро пожаловать в WaxGram! 🔒'
        }
      ]
      setChannels(defaultChannels)
      localStorage.setItem('channels', JSON.stringify(defaultChannels))
    }
  }, [])

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    channel.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-full flex flex-col">
      <div className="glass px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img src="https://i.ibb.co/dsywjJ5Y/W.png" alt="WaxGram" className="w-10 h-10 rounded-full" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#2b6bff] to-[#00c6ff] bg-clip-text text-transparent">
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
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white placeholder-gray-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {filteredChannels.map((channel, index) => (
          <motion.div
            key={channel.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => onSelectChannel(channel.id)}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-all"
          >
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[#2b6bff] to-[#0055ff] flex items-center justify-center">
              {channel.avatar ? (
                <img src={channel.avatar} alt={channel.name} className="w-full h-full object-cover" />
              ) : (
                <FiUsers className="text-white" size={24} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">{channel.name}</h3>
                <span className="text-xs text-gray-400">{channel.subscribers} подписчиков</span>
              </div>
              <p className="text-sm text-gray-400 truncate">{channel.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}