'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowLeft, FiMoreVertical, FiUsers, FiShare2, FiBell, FiUser, FiLoader, FiSend, FiHeart, FiMessageCircle } from 'react-icons/fi'
import { supabase } from '@/lib/supabase/client'

interface ChannelViewProps {
  channelId: string
  onBack: () => void
  isMobile?: boolean
}

interface Post {
  id: string
  content: string
  author_id: string
  author_name: string
  author_avatar?: string
  views: number
  comments: number
  created_at: string
}

interface Channel {
  id: string
  name: string
  description: string
  subscribers_count: number
  avatar_url: string | null
  owner_id: string
  is_owner?: boolean
}

export function ChannelView({ channelId, onBack, isMobile = false }: ChannelViewProps) {
  const [channel, setChannel] = useState<Channel | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [newPost, setNewPost] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadData = async () => {
      const userId = localStorage.getItem('temp_user_id')
      setCurrentUserId(userId)
      
      try {
        // Загружаем канал
        const { data: channelData, error: channelError } = await supabase
          .from('channels')
          .select('*')
          .eq('id', channelId)
          .single()
        
        if (channelError) throw channelError
        
        setChannel({
          ...channelData,
          is_owner: channelData.owner_id === userId
        })
        
        // Загружаем посты
        const { data: postsData, error: postsError } = await supabase
          .from('channel_posts')
          .select(`
            *,
            profiles:author_id (username, avatar_url)
          `)
          .eq('channel_id', channelId)
          .order('created_at', { ascending: false })
        
        if (postsError) throw postsError
        
        const formattedPosts = postsData?.map(post => ({
          ...post,
          author_name: post.profiles?.username || 'Пользователь',
          author_avatar: post.profiles?.avatar_url
        })) || []
        
        setPosts(formattedPosts)
      } catch (error) {
        console.error('Load channel error:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
    
    // Подписка на новые посты
    const subscription = supabase
      .channel(`channel:${channelId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'channel_posts',
        filter: `channel_id=eq.${channelId}`
      }, async (payload) => {
        const newPost = payload.new as any
        const { data: author } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', newPost.author_id)
          .single()
        
        setPosts(prev => [{
          ...newPost,
          author_name: author?.username || 'Пользователь',
          author_avatar: author?.avatar_url
        }, ...prev])
      })
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [channelId])

  const handleSendPost = async () => {
    if (!newPost.trim() || !channel || !currentUserId) return
    
    setSending(true)
    
    try {
      const { data, error } = await supabase
        .from('channel_posts')
        .insert({
          channel_id: channelId,
          author_id: currentUserId,
          content: newPost,
          views: 0,
          comments: 0
        })
        .select()
        .single()
      
      if (error) throw error
      
      const { data: author } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', currentUserId)
        .single()
      
      setPosts(prev => [{
        ...data,
        author_name: author?.username || 'Вы',
        author_avatar: author?.avatar_url
      }, ...prev])
      
      setNewPost('')
    } catch (error) {
      console.error('Send post error:', error)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (minutes < 1) return 'только что'
    if (minutes < 60) return `${minutes} мин назад`
    if (hours < 24) return `${hours} ч назад`
    return `${days} дн назад`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <FiLoader className="animate-spin text-[#2b6bff]" size={32} />
      </div>
    )
  }

  if (!channel) return null

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1a] to-[#0a0a0a]">
      {/* Header */}
      <div className="glass px-4 py-3 flex items-center justify-between safe-top">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-95"
          >
            <FiArrowLeft className="text-gray-400" size={20} />
          </button>
          
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#2b6bff] to-[#0055ff] flex items-center justify-center">
            {channel.avatar_url ? (
              <img src={channel.avatar_url} alt={channel.name} className="w-full h-full object-cover" />
            ) : (
              <FiUsers className="text-white" size={20} />
            )}
          </div>
          
          <div>
            <h1 className="font-semibold text-white">{channel.name}</h1>
            <p className="text-xs text-gray-400">{channel.subscribers_count} подписчиков</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <FiBell className="text-gray-400" size={20} />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <FiShare2 className="text-gray-400" size={20} />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <FiMoreVertical className="text-gray-400" size={20} />
          </button>
        </div>
      </div>

      {/* Posts */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-4xl mx-auto space-y-3">
          {posts.length === 0 && (
            <div className="text-center text-gray-500 py-10">
              <FiMessageCircle size={48} className="mx-auto mb-3 opacity-50" />
              <p>Нет постов</p>
              {channel.is_owner && (
                <p className="text-sm mt-2">Напишите первый пост в канале</p>
              )}
            </div>
          )}
          
          {posts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-2xl p-4 border border-white/10"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#2b6bff] to-[#0055ff] flex items-center justify-center flex-shrink-0">
                  {post.author_avatar ? (
                    <img src={post.author_avatar} alt={post.author_name} className="w-full h-full object-cover" />
                  ) : (
                    <FiUser className="text-white" size={18} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white">{post.author_name}</span>
                    <span className="text-xs text-gray-500">{formatTime(post.created_at)}</span>
                  </div>
                  <p className="text-gray-200 whitespace-pre-wrap">{post.content}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <button className="flex items-center gap-1 text-gray-400 hover:text-[#2b6bff] transition-colors text-xs">
                      <FiHeart size={14} /> {post.views}
                    </button>
                    <button className="flex items-center gap-1 text-gray-400 hover:text-[#2b6bff] transition-colors text-xs">
                      <FiMessageCircle size={14} /> {post.comments}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input for owner */}
      {channel.is_owner && (
        <div className="glass border-t border-white/10 p-3 safe-bottom">
          <div className="flex items-center gap-2 bg-white/5 rounded-full p-1 pl-4 border border-white/10">
            <input
              type="text"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendPost()}
              placeholder="Напишите пост..."
              className="flex-1 py-2.5 bg-transparent focus:outline-none text-white placeholder-gray-500 text-base"
            />
            <button
              onClick={handleSendPost}
              disabled={sending || !newPost.trim()}
              className="w-10 h-10 bg-gradient-to-r from-[#2b6bff] to-[#0055ff] rounded-full flex items-center justify-center hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {sending ? <FiLoader className="animate-spin" size={18} /> : <FiSend size={18} />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
