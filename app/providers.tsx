'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { subscribeToPushNotifications } from '@/lib/notifications'

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const userId = localStorage.getItem('temp_user_id')
    if (!userId) return

    // Обновляем статус онлайн
    supabase
      .from('profiles')
      .update({ online: true, last_seen: new Date().toISOString() })
      .eq('id', userId)
      .then(() => {
        // Подписываемся на Push уведомления после установки онлайн-статуса
        subscribeToPushNotifications(userId)
      })

    const handleUnload = () => {
      // Используем sendBeacon для надёжной отправки при закрытии страницы
      const data = JSON.stringify({ userId, online: false })
      navigator.sendBeacon?.('/api/auth/set-offline', data)
    }

    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [])

  return <>{children}</>
}
