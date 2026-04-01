'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

interface Message {
  id: string
  content: string
  sender_id: string
  room_id: string
  created_at: string
}

export function useRealtimeMessages(roomId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!roomId) return

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('sent_at', { ascending: true })
      
      if (data) {
        setMessages(data)
      }
      setLoading(false)
    }

    fetchMessages()

    const channel: RealtimeChannel = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [roomId])

  const sendMessage = async (content: string) => {
    if (!roomId) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('messages')
      .insert({
        room_id: roomId,
        sender_id: user.id,
        encrypted_content: content,
        message_type: 'text',
        sender_public_key: 'temp'
      })

    if (error) {
      console.error('Error sending message:', error)
    }
  }

  return { messages, loading, sendMessage }
}
