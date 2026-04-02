'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiSearch, FiPlus, FiUsers, FiLoader, FiUser, FiEye, FiEyeOff } from 'react-icons/fi'
import { supabase } from '@/lib/supabase/client'

interface Channel {
  id: string
  name: string
  description: string
  subscribers_count: number
  avatar_url: string | null
  cover_url: string | null
  owner_id: string
  created_at: string
  is_owner?: boolean
  is_subscribed?: boolean
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
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [searchResults, setSearchResults] = useState<Channel[]>([])
  const [searching, setSearching] = useState(false)

  const loadChannels = async () => {
    const userId = localStorage.getItem('temp_user_id')
    setCurrentUserId(userId)
    
    try {
      // Загружаем только каналы, на которые подписан пользователь
      const { data: subscriptions } = await supabase
        .from('channel_subscribers')
        .select('channel_id')
        .eq('user_id', userId)
      
      const subscribedChannelIds = subscriptions?.map(s => s.channel_id) || []
      
      if (subscribedChannelIds.length === 0) {
        setChannels([])
        setLoading(false)
        return
      }
      
      const { data: channelsData, error: channelsError } = await supabase
        .from('channels')
        .select('*')
        .in('id', subscribedChannelIds)
        .order('created_at', { ascending: false })
      
      if (channelsError) throw channelsError
      
      const formattedChannels = channelsData?.map(channel => ({
        ...channel,
        is_owner: channel.owner_id === userId,
        is_subscribed: true
      })) || []
      
      setChannels(formattedChannels)
    } catch (error) {
      console.error('Load channels error:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchChannels = async () => {
    if (!searchQuery.trim()) return
    
    setSearching(true)
    
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .ilike('name', `%${searchQuery}%`)
        .limit(20)
      
      if (error) throw error
      
      setSearchResults(data || [])
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearching(false)
    }
  }

  const subscribeToChannel = async (channelId: string) => {
    if (!currentUserId) return
    
    try {
      await supabase
        .from('channel_subscribers')
        .insert({ channel_id: channelId, user_id: currentUserId })
      
      // Обновляем счетчик подписчиков
      const channel = channels.find(c => c.id === channelId) || searchResults.find(c => c.id === channelId)
      if (channel) {
        await supabase
          .from('channels')
          .update({ subscribers_count: channel.subscribers_count + 1 })
          .eq('id', channelId)
      }
      
      await loadChannels()
      setShowSearchModal(false)
      setSearchQuery('')
      setSearchResults([])
    } catch (error) {
      console.error('Subscribe error:', error)
    }
  }

  useEffect(() => {
    loadChannels()
  }, [])

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (channel.description && channel.description.toLowerCase().includes(searchQuery.toLowerCase()))
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
            <div className="w-9 h-9 bg-gradient-to-br from-[#2b6bff] to-[#0055ff] rounded-full flex items-center justify-center">
              <FiUsers className="text-white" size={18} />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-[#2b6bff] to-[#00c6ff] bg-clip-text text-transparent">
              Мои каналы
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearchModal(true)}
              className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              title="Найти канал"
            >
              <FiSearch size={20} className="text-gray-400" />
            </button>
            <button
              onClick={onCreateChannel}
              className="p-2 bg-gradient-to-r from-[#2b6bff] to-[#0055ff] rounded-full hover:opacity-90 transition-colors"
            >
              <FiPlus size={20} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 pb-20">
        {channels.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-10">
            <FiUsers size={48} className="mb-3 opacity-50" />
            <p>Вы не подписаны ни на один канал</p>
            <p className="text-sm mt-2">Нажмите на кнопку поиска,<br />чтобы найти и подписаться на каналы</p>
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
                {channel.avatar_url ? (
                  <img src={channel.avatar_url} alt={channel.name} className="w-full h-full object-cover" />
                ) : (
                  <FiUsers className="text-white" size={24} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate text-base">{channel.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{channel.subscribers_count} подписчиков</p>
                <p className="text-sm text-gray-400 truncate mt-1">{channel.description || 'Нет описания'}</p>
              </div>
              
              {channel.is_owner && (
                <div className="px-2 py-1 bg-[#2b6bff]/20 rounded-full">
                  <span className="text-xs text-[#2b6bff]">Админ</span>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
      
      {/* Модальное окно поиска каналов */}
      {showSearchModal && (
        <>
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" onClick={() => setShowSearchModal(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-[101] p-4">
            <div className="bg-[#1a1a2e] rounded-2xl overflow-hidden border border-white/10 w-full max-w-md">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">Найти канал</h2>
                <button onClick={() => setShowSearchModal(false)} className="p-1 hover:bg-white/10 rounded-full">
                  <FiX size={20} className="text-gray-400" />
                </button>
              </div>
              
              <div className="p-4">
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Введите название канала..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white"
                      onKeyDown={(e) => e.key === 'Enter' && searchChannels()}
                    />
                  </div>
                  <button
                    onClick={searchChannels}
                    disabled={searching}
                    className="px-4 py-2.5 bg-gradient-to-r from-[#2b6bff] to-[#0055ff] rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    {searching ? <FiLoader className="animate-spin" size={18} /> : 'Найти'}
                  </button>
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {searchResults.map((channel) => (
                    <div key={channel.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#2b6bff] to-[#0055ff] flex items-center justify-center">
                          {channel.avatar_url ? (
                            <img src={channel.avatar_url} alt={channel.name} className="w-full h-full object-cover" />
                          ) : (
                            <FiUsers className="text-white" size={20} />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-white">{channel.name}</h3>
                          <p className="text-xs text-gray-400">{channel.subscribers_count} подписчиков</p>
                        </div>
                      </div>
                      <button
                        onClick={() => subscribeToChannel(channel.id)}
                        className="px-3 py-1.5 bg-[#2b6bff]/20 rounded-lg text-[#2b6bff] text-sm hover:bg-[#2b6bff]/40 transition-colors"
                      >
                        Подписаться
                      </button>
                    </div>
                  ))}
                  {searchQuery && !searching && searchResults.length === 0 && (
                    <p className="text-center text-gray-400 py-4">Каналы не найдены</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
