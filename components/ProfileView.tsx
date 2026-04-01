'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { FiCamera, FiEdit2, FiMail, FiPhone, FiLock, FiLogOut, FiCheck, FiX, FiUser } from 'react-icons/fi'

interface ProfileViewProps {
  onLogout: () => void
}

export function ProfileView({ onLogout }: ProfileViewProps) {
  const [user, setUser] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadUser = async () => {
      const tempUserId = localStorage.getItem('temp_user_id')
      const tempEmail = localStorage.getItem('temp_email')
      const savedAvatar = localStorage.getItem('user_avatar')
      const savedUsername = localStorage.getItem('user_username')
      const savedBio = localStorage.getItem('user_bio')
      
      setUser({
        id: tempUserId,
        email: tempEmail || 'user@waxgram.com',
        username: savedUsername || 'Пользователь',
        bio: savedBio || 'Привет! Я использую WaxGram — безопасный мессенджер',
        avatar: savedAvatar || null,
        createdAt: new Date().toISOString()
      })
      setUsername(savedUsername || 'Пользователь')
      setBio(savedBio || 'Привет! Я использую WaxGram — безопасный мессенджер')
      setAvatar(savedAvatar || null)
    }
    loadUser()
  }, [])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', user?.id || 'unknown')
      
      const response = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (data.success) {
        setAvatar(data.avatarUrl)
        localStorage.setItem('user_avatar', data.avatarUrl)
      }
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setTimeout(() => {
      localStorage.setItem('user_username', username)
      localStorage.setItem('user_bio', bio)
      setUser({ ...user, username, bio, avatar })
      setIsEditing(false)
      setSaving(false)
    }, 500)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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

          <div className="glass-card p-6 space-y-4">
            {isEditing ? (
              <>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Имя пользователя</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white"
                    placeholder="Введите username"
                  />
                  <p className="text-xs text-gray-500 mt-1">Это имя будут видеть другие пользователи</p>
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
                      setUsername(user?.username)
                      setBio(user?.bio)
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
                <div className="flex items-center gap-3 py-2">
                  <FiLock className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-400">Безопасность</p>
                    <p className="text-white font-medium">Сквозное шифрование</p>
                  </div>
                </div>
                <div className="pt-4">
                  <p className="text-xs text-gray-500">Пользователь с {formatDate(user?.createdAt)}</p>
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