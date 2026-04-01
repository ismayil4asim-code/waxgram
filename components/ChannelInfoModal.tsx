'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiUsers, FiCalendar, FiUser, FiEdit2, FiLink } from 'react-icons/fi'
import { supabase } from '@/lib/supabase/client'

interface ChannelInfoModalProps {
  isOpen: boolean
  onClose: () => void
  channelId: string
}

export function ChannelInfoModal({ isOpen, onClose, channelId }: ChannelInfoModalProps) {
  const [channel, setChannel] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isOpen && channelId) {
      loadChannelInfo()
    }
  }, [isOpen, channelId])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const loadChannelInfo = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('channels')
        .select(`
          *,
          profiles:owner_id (username, avatar_url, verified, verified_type)
        `)
        .eq('id', channelId)
        .single()
      
      if (!error && data) {
        setChannel(data)
      }
    } catch (error) {
      console.error('Load channel info error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" onClick={onClose} />
          <div className="fixed inset-0 flex items-center justify-center z-[101] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md"
            >
              <div className="bg-[#1a1a2e] rounded-2xl overflow-hidden border border-white/10">
                {/* Cover Image */}
                {channel?.cover_url && (
                  <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${channel.cover_url})` }} />
                )}
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <h2 className="text-lg font-semibold text-white">Информация о канале</h2>
                  <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full">
                    <FiX className="text-gray-400" size={20} />
                  </button>
                </div>
                
                <div className="p-4">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="spinner"></div>
                    </div>
                  ) : channel ? (
                    <div className="space-y-4">
                      {/* Avatar и название */}
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-[#2b6bff] to-[#0055ff]">
                          {channel.avatar_url ? (
                            <img src={channel.avatar_url} alt={channel.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FiUsers className="text-white" size={24} />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg">{channel.name}</h3>
                          <p className="text-xs text-gray-400">@{channel.name?.toLowerCase().replace(/\s/g, '_')}</p>
                        </div>
                      </div>
                      
                      {/* Описание */}
                      {channel.description && (
                        <div>
                          <p className="text-sm text-gray-300">{channel.description}</p>
                        </div>
                      )}
                      
                      {/* Статистика */}
                      <div className="flex gap-4 py-2">
                        <div>
                          <p className="text-xs text-gray-400">Подписчиков</p>
                          <p className="text-white font-semibold">{channel.subscribers_count}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Дата создания</p>
                          <p className="text-white font-semibold">{formatDate(channel.created_at)}</p>
                        </div>
                      </div>
                      
                      {/* Владелец */}
                      <div className="pt-2 border-t border-white/10">
                        <p className="text-xs text-gray-400 mb-2">Владелец</p>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[#2b6bff] to-[#0055ff]">
                            {channel.profiles?.avatar_url ? (
                              <img src={channel.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FiUser className="text-white" size={14} />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="text-white font-medium">@{channel.profiles?.username}</span>
                              {channel.profiles?.verified && (
                                <span className="text-[#2b6bff] text-xs">✓</span>
                              )}
                            </div>
                            {channel.profiles?.verified_type && (
                              <p className="text-xs text-gray-500">
                                {channel.profiles.verified_type === 'developer' && 'Разработчик WaxGram'}
                                {channel.profiles.verified_type === 'popular' && 'Популярный автор'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-gray-400 py-8">Не удалось загрузить информацию</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )

  return mounted && createPortal(modalContent, document.body)
}
