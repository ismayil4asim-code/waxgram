'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiShield, FiSearch, FiCheck, FiX, FiUser, FiStar, FiUsers, FiMessageSquare, FiHash, FiTrendingUp } from 'react-icons/fi'
import { supabase } from '@/lib/supabase/client'
import { Toast } from './Toast'

interface User {
  id: string
  username: string
  email: string
  avatar_url: string | null
  verified: boolean
  verified_type: string | null
  created_at: string
}

interface Stats {
  totalUsers: number
  verifiedUsers: number
  totalChannels: number
  totalMessages: number
  totalPosts: number
  activeToday: number
}

export function AdminPanel() {
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    verifiedUsers: 0,
    totalChannels: 0,
    totalMessages: 0,
    totalPosts: 0,
    activeToday: 0
  })
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' as 'success' | 'error' | 'info' })
  const [currentUser, setCurrentUser] = useState<any>(null)

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000)
  }

  useEffect(() => {
    const checkAdmin = async () => {
      const userId = localStorage.getItem('temp_user_id')
      const { data: user } = await supabase
        .from('profiles')
        .select('username, verified, verified_type')
        .eq('id', userId)
        .single()
      
      if (user?.verified_type !== 'developer') {
        showToast('У вас нет прав администратора', 'error')
        return
      }
      
      setCurrentUser(user)
      loadStats()
      loadUsers()
    }
    
    checkAdmin()
  }, [])

  const loadStats = async () => {
    try {
      // Общее количество пользователей
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
      
      // Количество верифицированных
      const { count: verifiedCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('verified', true)
      
      // Количество каналов
      const { count: channelsCount } = await supabase
        .from('channels')
        .select('*', { count: 'exact', head: true })
      
      // Количество сообщений
      const { count: messagesCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
      
      // Количество постов в каналах
      const { count: postsCount } = await supabase
        .from('channel_posts')
        .select('*', { count: 'exact', head: true })
      
      // Активные сегодня (пользователи, которые были онлайн сегодня)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { count: activeCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen', today.toISOString())
      
      setStats({
        totalUsers: usersCount || 0,
        verifiedUsers: verifiedCount || 0,
        totalChannels: channelsCount || 0,
        totalMessages: messagesCount || 0,
        totalPosts: postsCount || 0,
        activeToday: activeCount || 0
      })
    } catch (error) {
      console.error('Load stats error:', error)
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, username, email, avatar_url, verified, verified_type, created_at')
      .order('created_at', { ascending: false })
    
    if (data) {
      setUsers(data)
    }
    setLoading(false)
  }

  const updateVerification = async (userId: string, verified: boolean, verifiedType: string | null) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          verified: verified, 
          verified_type: verifiedType 
        })
        .eq('id', userId)
      
      if (error) throw error
      
      const user = users.find(u => u.id === userId)
      const notificationTitle = verified ? 'Поздравляем! 🎉' : 'Верификация снята'
      let notificationContent = ''
      
      if (verified) {
        if (verifiedType === 'developer') {
          notificationContent = 'Вы получили галочку разработчика! ⚡'
        } else if (verifiedType === 'popular') {
          notificationContent = 'Вы получили галочку популярного автора! ✓'
        } else if (verifiedType === 'moderator') {
          notificationContent = 'Вы получили галочку модератора! 🛡️'
        }
      } else {
        notificationContent = 'Ваша верификация была снята'
      }
      
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: verified ? 'verified' : 'unverified',
          title: notificationTitle,
          content: notificationContent,
          data: { verified_type: verifiedType }
        })
      
      showToast(`Пользователь ${verified ? 'верифицирован' : 'деверифицирован'}`, 'success')
      loadStats()
      loadUsers()
    } catch (error) {
      console.error('Update error:', error)
      showToast('Ошибка обновления', 'error')
    }
  }

  const getVerifiedBadge = (type: string | null) => {
    if (type === 'developer') {
      return { 
        icon: <img src="/image-developer-192.png" alt="Developer" className="w-4 h-4 inline" />, 
        color: 'text-purple-400', 
        label: 'Разработчик', 
        bg: 'bg-purple-500/20' 
      }
    }
    if (type === 'popular') {
      return { 
        icon: <img src="/image-192.png" alt="Verified" className="w-4 h-4 inline" />, 
        color: 'text-[#2b6bff]', 
        label: 'Популярный автор', 
        bg: 'bg-[#2b6bff]/20' 
      }
    }
    if (type === 'moderator') {
      return { 
        icon: <img src="/image-support-192.png" alt="Moderator" className="w-4 h-4 inline" />, 
        color: 'text-green-400', 
        label: 'Модератор', 
        bg: 'bg-green-500/20' 
      }
    }
    return null
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Доступ только для разработчиков</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="glass px-4 py-3">
        <div className="flex items-center gap-3 mb-4">
          <FiShield className="text-purple-400" size={28} />
          <div>
            <h1 className="text-xl font-bold text-white">Панель администратора</h1>
            <p className="text-xs text-gray-400">Управление пользователями и галочками</p>
          </div>
        </div>
        
        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <div className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <FiUsers className="text-[#2b6bff]" size={14} />
              <span className="text-xs text-gray-400">Всего пользователей</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <FiCheck className="text-green-400" size={14} />
              <span className="text-xs text-gray-400">Верифицированы</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.verifiedUsers}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <FiHash className="text-purple-400" size={14} />
              <span className="text-xs text-gray-400">Каналов</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalChannels}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <FiMessageSquare className="text-blue-400" size={14} />
              <span className="text-xs text-gray-400">Сообщений</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalMessages}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <FiTrendingUp className="text-yellow-400" size={14} />
              <span className="text-xs text-gray-400">Постов в каналах</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalPosts}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <FiUser className="text-green-400" size={14} />
              <span className="text-xs text-gray-400">Активны сегодня</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.activeToday}</p>
          </div>
        </div>
        
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск пользователей..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="space-y-2">
            {users
              .filter(u => u.username?.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((user) => {
                const badge = getVerifiedBadge(user.verified_type)
                
                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 rounded-xl p-3 border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#2b6bff] to-[#0055ff] flex items-center justify-center">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FiUser className="text-white" size={18} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-white">@{user.username}</span>
                          {user.verified && badge && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${badge.bg} ${badge.color}`}>
                              {badge.icon} {badge.label}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{user.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Регистрация: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex gap-1">
                        <button
                          onClick={() => updateVerification(user.id, true, 'developer')}
                          className={`p-1.5 rounded-lg transition-colors ${
                            user.verified && user.verified_type === 'developer'
                              ? 'bg-purple-500/20 text-purple-400'
                              : 'hover:bg-white/10 text-gray-400'
                          }`}
                          title="Выдать галочку разработчика"
                        >
                          <img src="/image-developer-192.png" alt="Developer" className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateVerification(user.id, true, 'popular')}
                          className={`p-1.5 rounded-lg transition-colors ${
                            user.verified && user.verified_type === 'popular'
                              ? 'bg-[#2b6bff]/20 text-[#2b6bff]'
                              : 'hover:bg-white/10 text-gray-400'
                          }`}
                          title="Выдать галочку популярного автора"
                        >
                          <img src="/image-192.png" alt="Verified" className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateVerification(user.id, true, 'moderator')}
                          className={`p-1.5 rounded-lg transition-colors ${
                            user.verified && user.verified_type === 'moderator'
                              ? 'bg-green-500/20 text-green-400'
                              : 'hover:bg-white/10 text-gray-400'
                          }`}
                          title="Выдать галочку модератора"
                        >
                          <img src="/image-support-192.png" alt="Moderator" className="w-4 h-4" />
                        </button>
                        {user.verified && (
                          <button
                            onClick={() => updateVerification(user.id, false, null)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-red-400 transition-colors"
                            title="Снять галочку"
                          >
                            <FiX size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
          </div>
        )}
      </div>
      
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ show: false, message: '', type: 'info' })}
      />
    </div>
  )
}
