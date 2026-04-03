'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiBell, FiBellOff, FiShield, FiStar, FiUser } from 'react-icons/fi'
import { supabase } from '@/lib/supabase/client'

interface Notification {
  id: string
  type: string
  title: string
  content: string
  read: boolean
  data: any
  created_at: string
}

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const tempUserId = localStorage.getItem('temp_user_id')
    if (!tempUserId) return

    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', tempUserId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) {
          setNotifications(data)
          setUnreadCount(data.filter(n => !n.read).length)
        }
      })

    // Подписка с фильтром по user_id — не получаем чужие уведомления
    const sub = supabase
      .channel(`notifications:${tempUserId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${tempUserId}`,
      }, (payload) => {
        const n = payload.new as Notification
        setNotifications(prev => [n, ...prev])
        setUnreadCount(prev => prev + 1)
      })
      .subscribe()

    return () => { sub.unsubscribe() }
  }, []) // Убрали userId из зависимостей — он не меняется

  const markAsRead = useCallback(async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  const markAllAsRead = useCallback(async () => {
    const userId = localStorage.getItem('temp_user_id')
    if (!userId) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [])

  const getIcon = (type: string) => {
    if (type === 'verified') return <FiShield className="text-[#2b6bff]" size={18} />
    if (type === 'developer') return <FiStar className="text-purple-400" size={18} />
    if (type === 'popular') return <FiStar className="text-[#2b6bff]" size={18} />
    return <FiUser className="text-gray-400" size={18} />
  }

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(v => !v)} className="relative p-2 hover:bg-white/10 rounded-full transition-colors">
        <FiBell className={unreadCount > 0 ? 'text-[#2b6bff]' : 'text-gray-400'} size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-80 bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-xl overflow-hidden z-50"
            >
              <div className="p-3 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-semibold text-white">Уведомления</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-[#2b6bff] hover:underline">Прочитать все</button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <FiBellOff className="mx-auto mb-2" size={32} />
                    <p className="text-sm">Нет уведомлений</p>
                  </div>
                ) : notifications.map(n => (
                  <div key={n.id} onClick={() => !n.read && markAsRead(n.id)}
                    className={`p-3 border-b border-white/10 cursor-pointer transition-colors ${!n.read ? 'bg-[#2b6bff]/10' : 'hover:bg-white/5'}`}>
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{getIcon(n.type)}</div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-white">{n.title}</h4>
                        <p className="text-xs text-gray-400 mt-1">{n.content}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(n.created_at).toLocaleString('ru-RU')}</p>
                      </div>
                      {!n.read && <div className="w-2 h-2 bg-[#2b6bff] rounded-full mt-2" />}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
