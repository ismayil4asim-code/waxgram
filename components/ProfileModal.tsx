'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiCalendar, FiUser, FiMail, FiMessageCircle } from 'react-icons/fi'
import { supabase } from '@/lib/supabase/client'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  userId?: string | null
}

export function ProfileModal({ isOpen, onClose, userId }: ProfileModalProps) {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isOpen && userId) {
      loadProfile()
    }
  }, [isOpen, userId])

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

  const loadProfile = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (!error && data) {
        setProfile(data)
      }
    } catch (error) {
      console.error('Load profile error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    if (!date) return 'недавно'
    return new Date(date).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getVerifiedBadge = () => {
    if (!profile?.verified) return null
    
    if (profile.verified_type === 'developer') {
      return (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 rounded-full">
          <span className="text-purple-400 text-xs">⚡</span>
          <span className="text-purple-400 text-xs">Разработчик</span>
        </div>
      )
    }
    
    if (profile.verified_type === 'popular') {
      return (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-[#2b6bff]/20 rounded-full">
          <span className="text-[#2b6bff] text-xs">✓</span>
          <span className="text-[#2b6bff] text-xs">Популярный автор</span>
        </div>
      )
    }
    
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 rounded-full">
        <span className="text-green-400 text-xs">✓</span>
        <span className="text-green-400 text-xs">Подтвержден</span>
      </div>
    )
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
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <h2 className="text-lg font-semibold text-white">Профиль пользователя</h2>
                  <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full">
                    <FiX className="text-gray-400" size={20} />
                  </button>
                </div>
                
                <div className="p-4">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="spinner"></div>
                    </div>
                  ) : profile ? (
                    <div className="space-y-4">
                      {/* Avatar и имя */}
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-[#2b6bff] to-[#0055ff]">
                          {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FiUser className="text-white" size={32} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-white text-lg">@{profile.username}</h3>
                            {getVerifiedBadge()}
                          </div>
                          {profile.full_name && (
                            <p className="text-sm text-gray-400">{profile.full_name}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Статус */}
                      <div className="flex items-center gap-2 py-2">
                        <div className={`w-2 h-2 rounded-full ${profile.online ? 'bg-green-500' : 'bg-gray-500'}`} />
                        <p className="text-sm text-gray-400">
                          {profile.online ? 'В сети' : profile.last_seen ? `Был(а) ${formatDate(profile.last_seen)}` : 'Не в сети'}
                        </p>
                      </div>
                      
                      {/* Bio */}
                      {profile.bio && (
                        <div className="pt-2">
                          <p className="text-sm text-gray-300">{profile.bio}</p>
                        </div>
                      )}
                      
                      {/* Информация */}
                      <div className="pt-2 border-t border-white/10 space-y-2">
                        <div className="flex items-center gap-2">
                          <FiMail className="text-gray-500" size={14} />
                          <span className="text-sm text-gray-400">{profile.email || 'Email скрыт'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FiCalendar className="text-gray-500" size={14} />
                          <span className="text-sm text-gray-400">Присоединился(ась): {formatDate(profile.created_at)}</span>
                        </div>
                      </div>
                      
                      {/* Кнопка действия */}
                      <button
                        onClick={() => {
                          onClose()
                          // Здесь можно добавить переход в чат
                        }}
                        className="w-full mt-4 py-2 bg-gradient-to-r from-[#2b6bff] to-[#0055ff] rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                      >
                        <FiMessageCircle size={16} />
                        <span>Написать сообщение</span>
                      </button>
                    </div>
                  ) : (
                    <p className="text-center text-gray-400 py-8">Не удалось загрузить профиль</p>
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
