'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { showNotification } from '@/lib/notifications'

interface Message {
  id: string
  room_id: string
  sender_id: string
  content: string
  message_type: string
  file_url?: string
  created_at: string
  username?: string
  avatar_url?: string
}

export function useSupabaseRealtime(roomId: string | null, userId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  // Кэшируем профили отправителей, чтобы не дёргать БД при каждом сообщении
  const senderCache = useRef<Record<string, { username?: string; avatar_url?: string }>>({})

  const loadMessages = useCallback(async () => {
    if (!roomId) return
    const { data, error } = await supabase
      .from('messages')
      .select('*, profiles(username, avatar_url)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(100)

    if (!error && data) {
      const formatted = data.map((msg: any) => ({
        ...msg,
        username: msg.profiles?.username,
        avatar_url: msg.profiles?.avatar_url,
      }))
      setMessages(formatted)
    }
    setLoading(false)
  }, [roomId])

  useEffect(() => {
    if (!roomId) return
    loadMessages()
  }, [roomId, loadMessages])

  useEffect(() => {
    if (!roomId) return

    const channel = supabase
      .channel(`realtime:room:${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`,
      }, async (payload) => {
        const msg = payload.new as any

        // Используем кэш профилей
        let sender = senderCache.current[msg.sender_id]
        if (!sender) {
          const { data } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', msg.sender_id)
            .single()
          sender = data || {}
          senderCache.current[msg.sender_id] = sender
        }

        const msgWithSender = { ...msg, username: sender.username, avatar_url: sender.avatar_url }
        setMessages(prev => [...prev, msgWithSender])

        if (msg.sender_id !== userId && msg.content) {
          showNotification(sender.username || 'Пользователь', msg.content, sender.avatar_url, () => window.focus())
        }
      })
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [roomId, userId])

  const sendMessage = useCallback(async (content: string, type = 'text', file?: File) => {
    if (!roomId || !userId || (!content && !file)) return false

    let fileUrl: string | null = null
    if (file) {
      const fileName = `${Date.now()}_${file.name}`
      const { data, error } = await supabase.storage
        .from('chat-files')
        .upload(`${roomId}/${fileName}`, file)
      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage.from('chat-files').getPublicUrl(data.path)
        fileUrl = publicUrl
      }
    }

    const { error } = await supabase.from('messages').insert({
      room_id: roomId,
      sender_id: userId,
      content: content || '',
      message_type: type,
      file_url: fileUrl,
    })

    return !error
  }, [roomId, userId])

  return { messages, loading, sendMessage }
}
