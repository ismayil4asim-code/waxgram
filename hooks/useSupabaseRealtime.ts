'use client'

import { useEffect, useState } from 'react'
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
  const [messages, setMessages] = useState<any[]>([])
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Загрузка сообщений
  useEffect(() => {
    if (!roomId) return

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles (
            username,
            avatar_url
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (!error && data) {
        const formattedMessages = data.map((msg: any) => ({
          ...msg,
          username: msg.profiles?.username,
          avatar_url: msg.profiles?.avatar_url
        }))
        setMessages(formattedMessages)
      }
      setLoading(false)
    }

    loadMessages()
  }, [roomId])

  // Подписка на новые сообщения
  useEffect(() => {
    if (!roomId) return

    const messageChannel = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`,
      }, async (payload) => {
        const newMessage = payload.new as any
        
        // Получаем данные отправителя
        const { data: sender } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', newMessage.sender_id)
          .single()
        
        const messageWithSender = {
          ...newMessage,
          username: sender?.username,
          avatar_url: sender?.avatar_url
        }
        
        setMessages((prev: any[]) => [...prev, messageWithSender])
        
        // Отправляем уведомление
        if (newMessage.sender_id !== userId && newMessage.content) {
          showNotification(
            sender?.username || 'Пользователь',
            newMessage.content,
            sender?.avatar_url,
            () => {
              window.focus()
            }
          )
        }
      })
      .subscribe()

    return () => {
      messageChannel.unsubscribe()
    }
  }, [roomId, userId])

  // Загрузка онлайн пользователей
  useEffect(() => {
    const loadOnlineUsers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, online')
        .eq('online', true)
        .limit(50)
      
      if (data) {
        setOnlineUsers(data)
      }
    }

    loadOnlineUsers()

    const onlineChannel = supabase
      .channel('online-users')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: 'online=eq.true',
      }, (payload) => {
        const updated = payload.new
        setOnlineUsers((prev: any[]) => {
          const exists = prev.find(u => u.id === updated.id)
          if (exists) {
            return prev.map(u => u.id === updated.id ? updated : u)
          }
          return [...prev, updated]
        })
      })
      .subscribe()

    return () => {
      onlineChannel.unsubscribe()
    }
  }, [])

  // Отправка сообщения
  const sendMessage = async (content: string, type: string = 'text', file?: File) => {
    if (!roomId || !userId || (!content && !file)) return

    let fileUrl: string | null = null

    if (file) {
      const fileName = `${Date.now()}_${file.name}`
      const { data, error } = await supabase.storage
        .from('chat-files')
        .upload(`${roomId}/${fileName}`, file)

      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage
          .from('chat-files')
          .getPublicUrl(data.path)
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

    if (error) {
      console.error('Send error:', error)
      return false
    }
    return true
  }

  return {
    messages,
    typingUsers,
    onlineUsers,
    loading,
    sendMessage,
  }
}
