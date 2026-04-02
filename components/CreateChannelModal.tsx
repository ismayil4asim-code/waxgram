'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiUpload, FiUsers, FiLoader } from 'react-icons/fi'
import { supabase } from '@/lib/supabase/client'

interface CreateChannelModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (channel: any) => void
}

export function CreateChannelModal({ isOpen, onClose, onCreate }: CreateChannelModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

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

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploading(true)
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatar(reader.result as string)
      setAvatarFile(file)
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Введите название канала')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const currentUserId = localStorage.getItem('temp_user_id')
      
      if (!currentUserId) {
        throw new Error('Пользователь не авторизован')
      }
      
      // Проверяем, есть ли уже канал у пользователя
      const { data: existingChannel, error: checkError } = await supabase
        .from('channels')
        .select('id, name')
        .eq('owner_id', currentUserId)
        .maybeSingle()
      
      if (existingChannel) {
        throw new Error(`Вы уже создали канал "${existingChannel.name}". Можно создать только один канал`)
      }
      
      let avatarUrl: string | null = null
      
      // Загружаем аватар если есть
      if (avatarFile) {
        const fileName = `channel_${Date.now()}_${avatarFile.name}`
        const { data, error: uploadError } = await supabase.storage
          .from('channel-avatars')
          .upload(fileName, avatarFile)
        
        if (!uploadError && data) {
          const { data: { publicUrl } } = supabase.storage
            .from('channel-avatars')
            .getPublicUrl(data.path)
          avatarUrl = publicUrl
        } else if (uploadError) {
          console.error('Avatar upload error:', uploadError)
        }
      }
      
      // Создаем канал в базе данных
      const { data: newChannel, error: createError } = await supabase
        .from('channels')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          avatar_url: avatarUrl,
          owner_id: currentUserId,
          subscribers_count: 1
        })
        .select()
        .single()
      
      if (createError) {
        if (createError.code === '23505') {
          throw new Error('Канал с таким названием уже существует')
        }
        throw createError
      }
      
      // Добавляем создателя как подписчика
      await supabase
        .from('channel_subscribers')
        .insert({
          channel_id: newChannel.id,
          user_id: currentUserId
        })
      
      onCreate(newChannel)
      onClose()
      setName('')
      setDescription('')
      setAvatar(null)
      setAvatarFile(null)
    } catch (err: any) {
      console.error('Create channel error:', err)
      setError(err.message || 'Ошибка создания канала')
    } finally {
      setLoading(false)
    }
  }

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" 
            onClick={onClose} 
          />
          <div className="fixed inset-0 flex items-center justify-center z-[101] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md"
            >
              <div className="bg-[#1a1a2e] rounded-2xl shadow-2xl overflow-hidden border border-white/10">
                {/* Заголовок */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <h2 className="text-lg font-semibold text-white">Создать канал</h2>
                  <button 
                    onClick={onClose} 
                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <FiX className="text-gray-400" size={20} />
                  </button>
                </div>
                
                {/* Контент */}
                <div className="p-4">
                  {/* Avatar */}
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-[#2b6bff] to-[#0055ff] flex items-center justify-center">
                        {avatar ? (
                          <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <FiUsers className="text-white" size={32} />
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 p-1.5 bg-[#2b6bff] rounded-full cursor-pointer hover:bg-[#0055ff] transition-colors">
                        {uploading ? (
                          <FiLoader className="animate-spin text-white" size={12} />
                        ) : (
                          <FiUpload size={12} className="text-white" />
                        )}
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleAvatarUpload} 
                          className="hidden" 
                        />
                      </label>
                    </div>
                  </div>
                  
                  {/* Форма */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Название канала *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value)
                          setError('')
                        }}
                        placeholder="Введите название"
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white"
                        maxLength={50}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {name.length}/50 символов
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Описание
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Расскажите о канале"
                        rows={3}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white resize-none"
                        maxLength={200}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {description.length}/200 символов
                      </p>
                    </div>
                    
                    {error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <p className="text-red-400 text-sm text-center">{error}</p>
                      </div>
                    )}
                    
                    <button
                      onClick={handleSubmit}
                      disabled={loading || !name.trim()}
                      className="w-full py-2.5 bg-gradient-to-r from-[#2b6bff] to-[#0055ff] rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <FiLoader className="animate-spin" size={18} />
                          <span>Создание...</span>
                        </div>
                      ) : (
                        'Создать канал'
                      )}
                    </button>
                  </div>
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
