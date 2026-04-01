'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiBell, FiBellOff, FiCheck, FiX, FiUser, FiStar, FiShield } from 'react-icons/fi'
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
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const loadNotifications = async () => {
      const tempUserId = localStorage.getItem('temp_user_id')
      if (!tempUserId) return
      setUserId(tempUserId)
      
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', tempUserId)
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (data) {
        setNotifications(data)
        setUnreadCount(data.filter(n => !n.read).length)
      }
    }
    
    loadNotifications()
    
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        const newNotif = payload.new as Notification
        setNotifications(prev => [newNotif, ...prev])
        setUnreadCount(prev => prev + 1)
      })
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
    
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    if (!userId) return
    
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
    
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'verified':
        return <FiShield className="text-[#2b6bff]" size={18} />
      case 'developer':
        return <FiStar className="text-purple-400" size={18} />
      case 'popular':
        return <FiStar className="text-[#2b6bff]" size={18} />
      default:
        return <FiUser className="text-gray-400" size={18} />
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-white/10 rounded-full transition-colors"
      >
        {unreadCount > 0 ? (
          <>
            <FiBell className="text-[#2b6bff]" size={20} />
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        ) : (
          <FiBell className="text-gray-400" size={20} />
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
                {notifications.length > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-[#2b6bff] hover:underline"
                  >
                    Прочитать все
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <FiBellOff className="mx-auto mb-2" size={32} />
                    <p className="text-sm">Нет уведомлений</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={`p-3 border-b border-white/10 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-[#2b6bff]/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-white">
                            {notification.title}
                          </h4>
                          <p className="text-xs text-gray-400 mt-1">
                            {notification.content}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-[#2b6bff] rounded-full mt-2" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
