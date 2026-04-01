'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { registerServiceWorker, subscribeToPushNotifications } from '@/lib/notifications'

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const init = async () => {
      const userId = localStorage.getItem('temp_user_id')
      
      if (userId) {
        // Обновляем статус онлайн
        await supabase
          .from('profiles')
          .update({ online: true, last_seen: new Date().toISOString() })
          .eq('id', userId)
        
        // Подписываемся на Push уведомления
        await subscribeToPushNotifications(userId)
        
        // При закрытии страницы обновляем статус
        window.addEventListener('beforeunload', async () => {
          await supabase
            .from('profiles')
            .update({ online: false, last_seen: new Date().toISOString() })
            .eq('id', userId)
        })
      }
    }
    
    init()
  }, [])
  
  return <>{children}</>
}