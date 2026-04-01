'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowLeft, FiMoreVertical, FiUsers, FiShare2, FiBell, FiUser, FiLoader, FiSend } from 'react-icons/fi'
import { supabase } from '@/lib/supabase/client'

interface ChannelViewProps {
  channelId: string
  onBack: () => void
  isMobile?: boolean
}

interface Post {
  id: string
  content: string
  author: string
  authorAvatar?: string
  time: string
  views: number
  comments: number
}

interface Channel {
  id: string
  name: string
  description: string
  subscribers: number
  avatar: string | null
  isOwner: boolean
}

export function ChannelView({ channelId, onBack, isMobile = false }: ChannelViewProps) {
  const [channel, setChannel] = useState<Channel | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [newPost, setNewPost] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadChannel = async () => {
      const savedChannels = localStorage.getItem('channels')
      if (savedChannels) {
        const channels = JSON.parse(savedChannels)
        const found = channels.find((c: any) => c.id === channelId)
        setChannel(found)
      }
      
      const savedPosts = localStorage.getItem(`channel_posts_${channelId}`)
      if (savedPosts) {
        setPosts(JSON.parse(savedPosts))
      } else {
        const demoPosts: Post[] = [
          {
            id: '1',
            content: 'Добро пожаловать в канал! Здесь будут публиковаться важные новости и обновления.',
            author: 'Админ',
            authorAvatar: 'https://i.ibb.co/dsywjJ5Y/W.png',
            time: new Date().toISOString(),
            views: 5,
            comments: 2
          }
        ]
        setPosts(demoPosts)
        localStorage.setItem(`channel_posts_${channelId}`, JSON.stringify(demoPosts))
      }
      
      setLoading(false)
    }
    
    loadChannel()
  }, [channelId])

  const handleSendPost = async () => {
    if (!newPost.trim() || !channel) return
    
    setSending(true)
    
    const currentUsername = localStorage.getItem('temp_username') || 'Вы'
    const currentAvatar = localStorage.getItem('user_avatar') || undefined
    
    const post: Post = {
      id: Date.now().toString(),
      content: newPost,
      author: currentUsername,
      authorAvatar: currentAvatar,
      time: new Date().toISOString(),
      views: 0,
      comments: 0
    }
    
    const updatedPosts = [post, ...posts]
    setPosts(updatedPosts)
    localStorage.setItem(`channel_posts_${channelId}`, JSON.stringify(updatedPosts))
    setNewPost('')
    setSending(false)
    
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
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
            {channel.avatar ? (
              <img src={channel.avatar} alt={channel.name} className="w-full h-full object-cover" />
            ) : (
              <FiUsers className="text-white" size={20} />
            )}
          </div>
          
          <div>
            <h1 className="font-semibold text-white">{channel.name}</h1>
            <p className="text-xs text-gray-400">{channel.subscribers} подписчиков</p>
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
          {posts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-2xl p-4 border border-white/10"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#2b6bff] to-[#0055ff] flex items-center justify-center flex-shrink-0">
                  {post.authorAvatar ? (
                    <img src={post.authorAvatar} alt={post.author} className="w-full h-full object-cover" />
                  ) : (
                    <FiUser className="text-white" size={18} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white">{post.author}</span>
                    <span className="text-xs text-gray-500">{formatTime(post.time)}</span>
                  </div>
                  <p className="text-gray-200 whitespace-pre-wrap">{post.content}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="flex items-center gap-1 text-gray-400 text-xs">
                      👁️ {post.views}
                    </span>
                    <span className="flex items-center gap-1 text-gray-400 text-xs">
                      💬 {post.comments}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input for owner */}
      {channel.isOwner && (
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
