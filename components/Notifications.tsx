'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiBell, FiBellOff, FiCheck, FiX } from 'react-icons/fi'
import { requestNotificationPermission, showNotification } from '@/lib/notifications'

interface NotificationItem {
  id: string
  title: string
  body: string
  read: boolean
  createdAt: Date
  onClick?: () => void
}

export function Notifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission()
    setPermission(granted ? 'granted' : 'denied')
  }

  const addNotification = (title: string, body: string, onClick?: () => void) => {
    const newNotification: NotificationItem = {
      id: Date.now().toString(),
      title,
      body,
      read: false,
      createdAt: new Date(),
      onClick,
    }

    setNotifications(prev => [newNotification, ...prev])
    setUnreadCount(prev => prev + 1)

    // Показываем системное уведомление
    showNotification(title, body, undefined, onClick)
  }

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    )
    setUnreadCount(0)
  }

  const clearAll = () => {
    setNotifications([])
    setUnreadCount(0)
  }

  return (
    <div className="relative">
      {/* Кнопка уведомлений */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-white/10 rounded-full transition-colors"
      >
        {permission === 'granted' ? (
          <FiBell className="text-gray-400" size={20} />
        ) : (
          <FiBellOff className="text-gray-400" size={20} />
        )}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Выпадающее меню уведомлений */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-80 bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-xl overflow-hidden z-50"
            >
              <div className="p-3 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-semibold text-white">Уведомления</h3>
                {permission !== 'granted' && (
                  <button
                    onClick={handleRequestPermission}
                    className="text-xs text-[#2b6bff] hover:underline"
                  >
                    Включить
                  </button>
                )}
                {notifications.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Все прочитаны
                    </button>
                    <button
                      onClick={clearAll}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Очистить
                    </button>
                  </div>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <FiBell className="mx-auto mb-2" size={32} />
                    <p className="text-sm">Нет уведомлений</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => {
                        markAsRead(notification.id)
                        notification.onClick?.()
                        setIsOpen(false)
                      }}
                      className={`p-3 border-b border-white/10 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-[#2b6bff]/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-white">
                            {notification.title}
                          </h4>
                          <p className="text-xs text-gray-400 mt-1">
                            {notification.body}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notification.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-[#2b6bff] rounded-full mt-1" />
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