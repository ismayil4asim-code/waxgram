'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiMoreVertical, FiUsers, FiShare2, FiBell, FiUser } from 'react-icons/fi'
import { Toast } from './Toast'

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

export function ChannelView({ channelId, onBack, isMobile = false }: ChannelViewProps) {
  const [channel, setChannel] = useState<any>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [newPost, setNewPost] = useState('')
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' as 'success' | 'error' | 'info' })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000)
  }

  useEffect(() => {
    const savedChannels = localStorage.getItem('channels')
    if (savedChannels) {
      const channels = JSON.parse(savedChannels)
      const found = channels.find((c: any) => c.id === channelId)
      setChannel(found)
    }
    
    // Загружаем посты
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
          time: 'только что',
          views: 5,
          comments: 2
        }
      ]
      setPosts(demoPosts)
      localStorage.setItem(`channel_posts_${channelId}`, JSON.stringify(demoPosts))
    }
  }, [channelId])

  const handleSendPost = () => {
    if (!newPost.trim()) return
    
    const post: Post = {
      id: Date.now().toString(),
      content: newPost,
      author: 'Вы',
      authorAvatar: localStorage.getItem('user_avatar') || undefined,
      time: 'только что',
      views: 0,
      comments: 0
    }
    
    const updatedPosts = [post, ...posts]
    setPosts(updatedPosts)
    localStorage.setItem(`channel_posts_${channelId}`, JSON.stringify(updatedPosts))
    setNewPost('')
    showToast('Пост опубликован', 'success')
  }

  if (!channel) return null

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1a] to-[#0a0a0a]">
      {/* Header */}
      <div className="glass px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
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
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {posts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4"
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
                    <span className="text-xs text-gray-500">{post.time}</span>
                  </div>
                  <p className="text-gray-200 whitespace-pre-wrap">{post.content}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="flex items-center gap-1 text-gray-400 text-sm">
                      👁️ {post.views}
                    </span>
                    <span className="flex items-center gap-1 text-gray-400 text-sm">
                      💬 {post.comments}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Input for owner */}
      {channel.isOwner && (
        <div className="glass border-t border-white/10 p-4">
          <div className="flex items-center gap-2 bg-white/5 rounded-full p-1 pl-4 border border-white/10">
            <input
              type="text"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendPost()}
              placeholder="Напишите пост..."
              className="flex-1 py-3 bg-transparent focus:outline-none text-white placeholder-gray-500"
            />
            <button
              onClick={handleSendPost}
              disabled={!newPost.trim()}
              className="px-4 py-2 bg-gradient-to-r from-[#2b6bff] to-[#0055ff] rounded-full text-white hover:opacity-90 disabled:opacity-50 transition-all"
            >
              Опубликовать
            </button>
          </div>
        </div>
      )}
      
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ show: false, message: '', type: 'info' })}
      />
    </div>
  )
}