'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { FiCamera, FiEdit2, FiMail, FiLock, FiLogOut, FiCheck, FiX, FiUser, FiCalendar } from 'react-icons/fi'
import { supabase } from '@/lib/supabase/client'

interface ProfileViewProps {
  onLogout: () => void
}

export function ProfileView({ onLogout }: ProfileViewProps) {
  const [user, setUser] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [birthDate, setBirthDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Загружаем данные из Supabase
  useEffect(() => {
    const loadProfile = async () => {
      const userId = localStorage.getItem('temp_user_id')
      const email = localStorage.getItem('temp_email')
      
      if (!userId) return
      
      try {
        // Загружаем из базы данных
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
        
        if (error) {
          console.error('Load profile error:', error)
          // Если ошибка, используем localStorage как запасной вариант
          const savedUsername = localStorage.getItem('temp_username')
          const savedAvatar = localStorage.getItem('user_avatar')
          const savedBio = localStorage.getItem('user_bio')
          
          setUser({
            id: userId,
            email: email || 'user@waxgram.com',
            username: savedUsername || 'Пользователь',
            bio: savedBio || '',
            avatar_url: savedAvatar || null,
            birth_date: '',
            created_at: new Date().toISOString()
          })
          setUsername(savedUsername || 'Пользователь')
          setBio(savedBio || '')
          setAvatar(savedAvatar || null)
        } else if (data) {
          setUser(data)
          setUsername(data.username || 'Пользователь')
          setBio(data.bio || '')
          setAvatar(data.avatar_url)
          setBirthDate(data.birth_date || '')
          
          // Обновляем localStorage
          localStorage.setItem('temp_username', data.username)
          if (data.avatar_url) localStorage.setItem('user_avatar', data.avatar_url)
          if (data.bio) localStorage.setItem('user_bio', data.bio)
        }
      } catch (err) {
        console.error('Load error:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadProfile()
  }, [])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploading(true)
    
    try {
      // Конвертируем в base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string
        setAvatar(base64)
        
        // Сохраняем в базу
        if (user?.id) {
          const { error } = await supabase
            .from('profiles')
            .update({ avatar_url: base64 })
            .eq('id', user.id)
          
          if (error) {
            console.error('Update avatar error:', error)
          } else {
            localStorage.setItem('user_avatar', base64)
          }
        }
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Upload error:', error)
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!user?.id) return
    
    setSaving(true)
    
    try {
      const updates: any = {
        username: username,
        bio: bio,
        birth_date: birthDate || null,
        avatar_url: avatar,
        updated_at: new Date().toISOString()
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
      
      if (error) {
        console.error('Update error:', error)
      } else {
        // Обновляем localStorage
        localStorage.setItem('temp_username', username)
        localStorage.setItem('user_bio', bio)
        if (avatar) localStorage.setItem('user_avatar', avatar)
        
        setUser({ ...user, ...updates })
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setSaving(false)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1a] to-[#0a0a0a]">
      <div className="max-w-4xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#2b6bff] to-[#00c6ff] bg-clip-text text-transparent">Профиль</h1>
            {!isEditing && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
              >
                <FiEdit2 size={18} />
                <span>Редактировать</span>
              </motion.button>
            )}
          </div>

          {/* Avatar */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-[#2b6bff] to-[#0055ff] flex items-center justify-center">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl font-bold text-white">
                    {username?.[0]?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              {isEditing && (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 p-2 bg-[#2b6bff] rounded-full hover:bg-[#0055ff] transition-colors disabled:opacity-50"
                  >
                    {uploading ? (
                      <div className="spinner w-4 h-4"></div>
                    ) : (
                      <FiCamera size={16} className="text-white" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="glass-card p-6 space-y-4">
            {isEditing ? (
              <>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Имя пользователя *</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">Только буквы, цифры и подчеркивания</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Дата рождения</label>
                  <div className="relative">
                    <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">О себе</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white resize-none"
                    placeholder="Расскажите о себе..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-gradient-to-r from-[#2b6bff] to-[#0055ff] text-white py-2 rounded-xl flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <div className="spinner w-5 h-5"></div>
                    ) : (
                      <>
                        <FiCheck size={18} /> Сохранить
                      </>
                    )}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setIsEditing(false)
                      setUsername(user?.username || 'Пользователь')
                      setBio(user?.bio || '')
                      setAvatar(user?.avatar_url)
                      setBirthDate(user?.birth_date || '')
                    }}
                    className="flex-1 bg-white/10 text-white py-2 rounded-xl flex items-center justify-center gap-2"
                  >
                    <FiX size={18} /> Отмена
                  </motion.button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 py-2">
                  <FiUser className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-400">Имя пользователя</p>
                    <p className="text-white font-medium">@{username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-2">
                  <FiMail className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="text-white font-medium">{user?.email}</p>
                  </div>
                </div>
                {birthDate && (
                  <div className="flex items-center gap-3 py-2">
                    <FiCalendar className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-400">Дата рождения</p>
                      <p className="text-white font-medium">{formatDate(birthDate)}</p>
                    </div>
                  </div>
                )}
                {bio && (
                  <div className="flex items-start gap-3 py-2">
                    <FiEdit2 className="text-gray-400 mt-1" size={20} />
                    <div>
                      <p className="text-sm text-gray-400">О себе</p>
                      <p className="text-white">{bio}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 py-2">
                  <FiLock className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-400">Безопасность</p>
                    <p className="text-white font-medium">Сквозное шифрование</p>
                  </div>
                </div>
                <div className="pt-4">
                  <p className="text-xs text-gray-500">Пользователь с {formatDate(user?.created_at)}</p>
                </div>
              </>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLogout}
            className="w-full glass-card p-4 flex items-center justify-center gap-3 text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <FiLogOut size={20} />
            <span>Выйти</span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}
