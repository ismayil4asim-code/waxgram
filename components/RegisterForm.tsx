'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiUser, FiCalendar, FiInfo, FiCamera, FiX } from 'react-icons/fi'

interface RegisterFormProps {
  email: string
  onRegister: (data: { username: string; bio: string; birthDate: string; avatarUrl: string | null }) => void
  onBack: () => void
}

export function RegisterForm({ email, onRegister, onBack }: RegisterFormProps) {
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

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
    if (!username.trim()) {
      setError('Придумайте имя пользователя')
      return
    }
    
    if (username.length < 3) {
      setError('Имя пользователя должно содержать минимум 3 символа')
      return
    }
    
    let avatarUrl = null
    
    // Загружаем аватар если есть
    if (avatarFile) {
      // Временно сохраняем как data URL
      avatarUrl = avatar
    }
    
    onRegister({
      username: username.trim(),
      bio: bio.trim(),
      birthDate,
      avatarUrl
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-8"
    >
      <h2 className="text-2xl font-bold text-white text-center mb-6">
        Завершите регистрацию
      </h2>
      
      <p className="text-gray-400 text-sm text-center mb-6">
        Аккаунт для {email}
      </p>
      
      {/* Avatar */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-[#2b6bff] to-[#0055ff] flex items-center justify-center">
            {avatar ? (
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <FiUser className="text-white" size={40} />
            )}
          </div>
          <label className="absolute bottom-0 right-0 p-2 bg-[#2b6bff] rounded-full cursor-pointer hover:bg-[#0055ff] transition-colors">
            <FiCamera size={16} className="text-white" />
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>
      
      {/* Username */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">
          Имя пользователя *
        </label>
        <div className="relative">
          <FiUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="например: john_doe"
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-gray-700 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">Только буквы, цифры и подчеркивания</p>
      </div>
      
      {/* Birth Date */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">
          Дата рождения
        </label>
        <div className="relative">
          <FiCalendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-gray-700 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white"
          />
        </div>
      </div>
      
      {/* Bio */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">
          О себе
        </label>
        <div className="relative">
          <FiInfo className="absolute left-4 top-4 text-gray-400" size={18} />
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Расскажите немного о себе..."
            rows={3}
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-gray-700 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white resize-none"
          />
        </div>
      </div>
      
      {error && (
        <p className="text-red-400 text-sm text-center mb-4">{error}</p>
      )}
      
      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onBack}
          className="flex-1 bg-white/10 text-white py-3 rounded-xl font-medium hover:bg-white/20 transition-all"
        >
          Назад
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={!username.trim()}
          className="flex-1 bg-gradient-to-r from-[#2b6bff] to-[#0055ff] text-white py-3 rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-all"
        >
          Завершить
        </motion.button>
      </div>
    </motion.div>
  )
}
