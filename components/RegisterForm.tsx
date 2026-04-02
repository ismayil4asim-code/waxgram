'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiUser, FiCalendar, FiInfo, FiCamera, FiCheck, FiArrowLeft, FiLoader, FiLock, FiMail, FiUserPlus } from 'react-icons/fi'

interface RegisterFormProps {
  email: string
  onRegister: (data: { 
    username: string; 
    firstName: string; 
    lastName: string; 
    bio: string; 
    birthDate: string; 
    avatarUrl: string | null;
    password: string;
  }) => Promise<void>
  onBack: () => void
}

export function RegisterForm({ email, onRegister, onBack }: RegisterFormProps) {
  const [username, setUsername] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [bio, setBio] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [usernameError, setUsernameError] = useState('')

  const validateUsername = (value: string) => {
    const regex = /^[a-zA-Z0-9_]+$/
    if (!regex.test(value)) {
      setUsernameError('Только английские буквы, цифры и подчеркивания')
      return false
    }
    setUsernameError('')
    return true
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setUsername(value)
    validateUsername(value)
  }

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
    
    if (!validateUsername(username)) {
      return
    }
    
    if (username.length < 3) {
      setError('Имя пользователя должно содержать минимум 3 символа')
      return
    }
    
    if (username.length > 20) {
      setError('Имя пользователя не должно превышать 20 символов')
      return
    }
    
    if (!firstName.trim()) {
      setError('Введите имя')
      return
    }
    
    if (!password) {
      setError('Введите пароль')
      return
    }
    
    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов')
      return
    }
    
    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }
    
    setIsSubmitting(true)
    setError('')
    
    let avatarUrl = null
    
    if (avatarFile) {
      avatarUrl = avatar
    }
    
    try {
      await onRegister({
        username: username.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        bio: bio.trim(),
        birthDate,
        avatarUrl,
        password
      })
    } catch (err: any) {
      if (err.message.includes('username') && err.message.includes('duplicate')) {
        setError('Это имя пользователя уже занято')
      } else {
        setError(err.message || 'Ошибка регистрации')
      }
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-8 max-h-[90vh] overflow-y-auto"
    >
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <FiArrowLeft size={18} />
        <span className="text-sm">Назад</span>
      </button>
      
      <h2 className="text-2xl font-bold text-white text-center mb-2">
        Завершите регистрацию
      </h2>
      
      <p className="text-gray-400 text-sm text-center mb-6">
        Аккаунт для <span className="text-[#2b6bff]">{email}</span>
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
            {uploading ? (
              <FiLoader size={16} className="text-white animate-spin" />
            ) : (
              <FiCamera size={16} className="text-white" />
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
      
      {/* Username */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">
          Username * (только английские буквы, цифры, _)
        </label>
        <div className="relative">
          <FiUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={username}
            onChange={handleUsernameChange}
            placeholder="john_doe"
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-gray-700 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white"
          />
        </div>
        {usernameError && <p className="text-red-400 text-xs mt-1">{usernameError}</p>}
      </div>
      
      {/* First Name & Last Name */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Имя *</label>
          <div className="relative">
            <FiUserPlus className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Иван"
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-700 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Фамилия</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Иванов"
            className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white"
          />
        </div>
      </div>
      
      {/* Password */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">
          Пароль * (минимум 6 символов)
        </label>
        <div className="relative">
          <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-gray-700 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white"
          />
        </div>
      </div>
      
      {/* Confirm Password */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">
          Подтвердите пароль *
        </label>
        <div className="relative">
          <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••"
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-gray-700 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white"
          />
        </div>
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
      
      <button
        onClick={handleSubmit}
        disabled={!username.trim() || !firstName.trim() || !password || uploading || isSubmitting}
        className="w-full bg-gradient-to-r from-[#2b6bff] to-[#0055ff] text-white py-3 rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <FiLoader size={18} className="animate-spin" />
            Регистрация...
          </>
        ) : (
          <>
            <FiCheck size={18} />
            Завершить регистрацию
          </>
        )}
      </button>
    </motion.div>
  )
}
