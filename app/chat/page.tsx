'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { ChatInterface } from '@/components/ChatInterface'

export default function ChatPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      // Проверяем временную сессию (для демо-режима)
      const tempUserId = localStorage.getItem('temp_user_id')
      
      if (tempUserId) {
        setLoading(false)
        return
      }
      
      // Проверяем реальную сессию Supabase
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth')
      } else {
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1a] to-[#0a0a0a]">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return <ChatInterface />
}
