'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FiShield, FiSearch, FiCheck, FiX, FiUser, FiStar, FiUsers, FiMessageSquare, FiHash, FiTrendingUp, FiTool, FiLoader } from 'react-icons/fi'
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
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, verifiedUsers: 0, totalChannels: 0, totalMessages: 0, totalPosts: 0, activeToday: 0 })
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' as 'success' | 'error' | 'info' })
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState('')
  const [togglingMaintenance, setTogglingMaintenance] = useState(false)

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000)
  }, [])

  const loadStats = useCallback(async () => {
    // Грузим все счётчики параллельно — вместо 6 последовательных запросов
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const [u, v, ch, msg, posts, active] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('verified', true),
      supabase.from('channels').select('*', { count: 'exact', head: true }),
      supabase.from('messages').select('*', { count: 'exact', head: true }),
      supabase.from('channel_posts').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('last_seen', today.toISOString()),
    ])
    setStats({
      totalUsers: u.count || 0,
      verifiedUsers: v.count || 0,
      totalChannels: ch.count || 0,
      totalMessages: msg.count || 0,
      totalPosts: posts.count || 0,
      activeToday: active.count || 0,
    })
  }, [])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, username, email, avatar_url, verified, verified_type, created_at')
      .order('created_at', { ascending: false })
      .limit(200) // Ограничиваем список
    if (data) setUsers(data)
    setLoading(false)
  }, [])

  const loadMaintenanceStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/maintenance')
      const data = await res.json()
      setMaintenanceMode(data.maintenance)
      setMaintenanceMessage(data.message)
    } catch { }
  }, [])

  useEffect(() => {
    const init = async () => {
      const userId = localStorage.getItem('temp_user_id')
      const { data: user } = await supabase.from('profiles').select('username, verified, verified_type').eq('id', userId).single()
      if (user?.verified_type !== 'developer') { showToast('У вас нет прав администратора', 'error'); return }
      setCurrentUser(user)
      // Грузим всё параллельно
      await Promise.all([loadStats(), loadUsers(), loadMaintenanceStatus()])
    }
    init()
  }, [loadStats, loadUsers, loadMaintenanceStatus, showToast])

  const updateVerification = async (userId: string, verified: boolean, verifiedType: string | null) => {
    const { error } = await supabase.from('profiles').update({ verified, verified_type: verifiedType }).eq('id', userId)
    if (error) { showToast('Ошибка обновления', 'error'); return }

    const notifContent = !verified ? 'Ваша верификация была снята'
      : verifiedType === 'developer' ? 'Вы получили галочку разработчика! ⚡'
      : verifiedType === 'popular' ? 'Вы получили галочку популярного автора! ✓'
      : 'Вы получили галочку модератора! 🛡️'

    await Promise.all([
      supabase.from('notifications').insert({
        user_id: userId, type: verified ? 'verified' : 'unverified',
        title: verified ? 'Поздравляем! 🎉' : 'Верификация снята',
        content: notifContent, data: { verified_type: verifiedType }
      }),
      loadStats(),
    ])
    // Обновляем локально — не перезагружаем всех пользователей
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, verified, verified_type: verifiedType } : u))
    showToast(`Пользователь ${verified ? 'верифицирован' : 'деверифицирован'}`, 'success')
  }

  const toggleMaintenance = async () => {
    setTogglingMaintenance(true)
    try {
      const userId = localStorage.getItem('temp_user_id')
      const res = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !maintenanceMode, message: maintenanceMessage || 'Технические работы. Пожалуйста, зайдите позже.', token: userId }),
      })
      const data = await res.json()
      if (data.success) { setMaintenanceMode(data.maintenance); setMaintenanceMessage(data.message); showToast(`Режим ${data.maintenance ? 'включен' : 'выключен'}`, 'success') }
      else showToast(data.error || 'Ошибка', 'error')
    } catch { showToast('Ошибка', 'error') }
    finally { setTogglingMaintenance(false) }
  }

  const getBadge = (type: string | null) => {
    if (type === 'developer') return { src: '/image-developer-192.png', color: 'text-purple-400', label: 'Разработчик', bg: 'bg-purple-500/20' }
    if (type === 'popular') return { src: '/image-192.png', color: 'text-[#2b6bff]', label: 'Популярный', bg: 'bg-[#2b6bff]/20' }
    if (type === 'moderator') return { src: '/image-support-192.png', color: 'text-green-400', label: 'Модератор', bg: 'bg-green-500/20' }
    return null
  }

  if (!currentUser) return <div className="flex items-center justify-center h-full"><p className="text-gray-400">Доступ только для разработчиков</p></div>

  const filtered = users.filter(u => u.username?.toLowerCase().includes(searchQuery.toLowerCase()))

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

        {/* Режим обслуживания */}
        <div className="bg-white/5 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><FiTool className="text-yellow-400" size={20} /><h3 className="font-medium text-white">Режим обслуживания</h3></div>
            <button onClick={toggleMaintenance} disabled={togglingMaintenance}
              className={`px-4 py-2 rounded-xl transition-all ${maintenanceMode ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
              {togglingMaintenance ? <FiLoader className="animate-spin" size={16} /> : maintenanceMode ? 'Выключить' : 'Включить'}
            </button>
          </div>
          {maintenanceMode && (
            <textarea value={maintenanceMessage} onChange={e => setMaintenanceMessage(e.target.value)} rows={2}
              placeholder="Сообщение о технических работах..."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white text-sm" />
          )}
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {[
            { icon: <FiUsers className="text-[#2b6bff]" size={14} />, label: 'Пользователей', val: stats.totalUsers },
            { icon: <FiCheck className="text-green-400" size={14} />, label: 'Верифицированы', val: stats.verifiedUsers },
            { icon: <FiHash className="text-purple-400" size={14} />, label: 'Каналов', val: stats.totalChannels },
            { icon: <FiMessageSquare className="text-blue-400" size={14} />, label: 'Сообщений', val: stats.totalMessages },
            { icon: <FiTrendingUp className="text-yellow-400" size={14} />, label: 'Постов', val: stats.totalPosts },
            { icon: <FiUser className="text-green-400" size={14} />, label: 'Активны сегодня', val: stats.activeToday },
          ].map(s => (
            <div key={s.label} className="bg-white/5 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-xs text-gray-400">{s.label}</span></div>
              <p className="text-2xl font-bold text-white">{s.val}</p>
            </div>
          ))}
        </div>

        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Поиск пользователей..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        {loading ? (
          <div className="flex justify-center py-8"><FiLoader className="animate-spin text-[#2b6bff]" size={32} /></div>
        ) : (
          <div className="space-y-2">
            {filtered.map(user => {
              const badge = getBadge(user.verified_type)
              return (
                <div key={user.id} className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#2b6bff] to-[#0055ff] flex items-center justify-center">
                      {user.avatar_url ? <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" /> : <FiUser className="text-white" size={18} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white">@{user.username}</span>
                        {user.verified && badge && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${badge.bg} ${badge.color} flex items-center gap-1`}>
                            <img src={badge.src} alt="" className="w-3 h-3" /> {badge.label}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{user.email}</p>
                      <p className="text-xs text-gray-500">{new Date(user.created_at).toLocaleDateString('ru-RU')}</p>
                    </div>
                    <div className="flex gap-1">
                      {(['developer', 'popular', 'moderator'] as const).map(type => {
                        const b = getBadge(type)!
                        return (
                          <button key={type} onClick={() => updateVerification(user.id, true, type)} title={`Выдать: ${b.label}`}
                            className={`p-1.5 rounded-lg transition-colors ${user.verified && user.verified_type === type ? `${b.bg} ${b.color}` : 'hover:bg-white/10 text-gray-400'}`}>
                            <img src={b.src} alt={b.label} className="w-4 h-4" />
                          </button>
                        )
                      })}
                      {user.verified && (
                        <button onClick={() => updateVerification(user.id, false, null)} className="p-1.5 rounded-lg hover:bg-white/10 text-red-400 transition-colors" title="Снять">
                          <FiX size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Toast message={toast.message} type={toast.type} isVisible={toast.show} onClose={() => setToast({ show: false, message: '', type: 'info' })} />
    </div>
  )
}
