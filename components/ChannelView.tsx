'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowLeft, FiMoreVertical, FiUsers, FiShare2, FiBell, FiUser, FiLoader, FiSend, FiHeart, FiMessageCircle } from 'react-icons/fi'
import { supabase } from '@/lib/supabase/client'
import { ChannelInfoModal } from './ChannelInfoModal'

interface ChannelViewProps {
  channelId: string
  onBack: () => void
  isMobile?: boolean
}

interface Comment {
  id: string
  content: string
  author_id: string
  author_name: string
  author_avatar?: string
  created_at: string
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
  liked_by_user?: boolean
}

interface Channel {
  id: string
  name: string
  description: string
  subscribers_count: number
  avatar_url: string | null
  cover_url: string | null
  owner_id: string
  created_at: string
  is_owner?: boolean
}

export function ChannelView({ channelId, onBack, isMobile = false }: ChannelViewProps) {
  const [channel, setChannel] = useState<Channel | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [newPost, setNewPost] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showComments, setShowComments] = useState<string | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)

  const loadPosts = async () => {
    if (!currentUserId) return
    
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('channel_posts')
        .select(`
          *,
          profiles:author_id (username, avatar_url)
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: false })
      
      if (postsError) throw postsError
      
      const postIds = postsData?.map(p => p.id) || []
      let userLikes: string[] = []
      
      if (postIds.length > 0) {
        const { data: likesData } = await supabase
          .from('channel_post_likes')
          .select('post_id')
          .eq('user_id', currentUserId)
          .in('post_id', postIds)
        
        userLikes = likesData?.map(l => l.post_id) || []
      }
      
      const formattedPosts = postsData?.map(post => ({
        ...post,
        author_name: post.profiles?.username || 'Пользователь',
        author_avatar: post.profiles?.avatar_url,
        liked_by_user: userLikes.includes(post.id),
        views: post.views || 0,
        comments: post.comments || 0
      })) || []
      
      setPosts(formattedPosts)
    } catch (error) {
      console.error('Load posts error:', error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      const userId = localStorage.getItem('temp_user_id')
      setCurrentUserId(userId)
      
      try {
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
        
        // Проверяем подписку
        if (userId) {
          const { data: subData } = await supabase
            .from('channel_subscribers')
            .select('*')
            .eq('channel_id', channelId)
            .eq('user_id', userId)
            .single()
          
          setIsSubscribed(!!subData)
        }
        
        await loadPosts()
      } catch (error) {
        console.error('Load channel error:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
    
    const postsSubscription = supabase
      .channel(`channel-posts:${channelId}`)
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
          author_avatar: author?.avatar_url,
          liked_by_user: newPost.author_id === currentUserId,
          views: newPost.views || 0,
          comments: newPost.comments || 0
        }, ...prev])
      })
      .subscribe()
    
    const likesSubscription = supabase
      .channel('post-likes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'channel_post_likes'
      }, () => {
        loadPosts()
      })
      .subscribe()
    
    const commentsSubscription = supabase
      .channel('post-comments')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'channel_post_comments'
      }, () => {
        loadPosts()
      })
      .subscribe()
    
    return () => {
      postsSubscription.unsubscribe()
      likesSubscription.unsubscribe()
      commentsSubscription.unsubscribe()
    }
  }, [channelId])

  const loadComments = async (postId: string) => {
    const { data, error } = await supabase
      .from('channel_post_comments')
      .select(`
        *,
        profiles:author_id (username, avatar_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    
    if (!error && data) {
      const formattedComments = data.map(comment => ({
        ...comment,
        author_name: comment.profiles?.username || 'Пользователь',
        author_avatar: comment.profiles?.avatar_url
      }))
      setComments(formattedComments)
    }
  }

  const handleLike = async (postId: string) => {
    if (!currentUserId) return
    
    const post = posts.find(p => p.id === postId)
    if (!post) return
    
    try {
      if (post.liked_by_user) {
        const { error } = await supabase
          .from('channel_post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUserId)
        
        if (!error) {
          await supabase
            .from('channel_posts')
            .update({ views: Math.max(0, post.views - 1) })
            .eq('id', postId)
          
          setPosts(prev => prev.map(p => 
            p.id === postId 
              ? { ...p, views: Math.max(0, p.views - 1), liked_by_user: false }
              : p
          ))
        }
      } else {
        const { error } = await supabase
          .from('channel_post_likes')
          .insert({
            post_id: postId,
            user_id: currentUserId
          })
        
        if (!error) {
          await supabase
            .from('channel_posts')
            .update({ views: post.views + 1 })
            .eq('id', postId)
          
          setPosts(prev => prev.map(p => 
            p.id === postId 
              ? { ...p, views: p.views + 1, liked_by_user: true }
              : p
          ))
        }
      }
    } catch (error) {
      console.error('Like error:', error)
    }
  }

  const handleAddComment = async (postId: string) => {
    if (!newComment.trim() || !currentUserId) return
    
    setSendingComment(true)
    
    const post = posts.find(p => p.id === postId)
    if (!post) return
    
    try {
      const { data, error } = await supabase
        .from('channel_post_comments')
        .insert({
          post_id: postId,
          author_id: currentUserId,
          content: newComment
        })
        .select()
        .single()
      
      if (error) throw error
      
      await supabase
        .from('channel_posts')
        .update({ comments: post.comments + 1 })
        .eq('id', postId)
      
      const { data: author } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', currentUserId)
        .single()
      
      const newCommentObj = {
        ...data,
        author_name: author?.username || 'Вы',
        author_avatar: author?.avatar_url
      }
      
      setComments(prev => [...prev, newCommentObj])
      setNewComment('')
      
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, comments: p.comments + 1 }
          : p
      ))
    } catch (error) {
      console.error('Comment error:', error)
    } finally {
      setSendingComment(false)
    }
  }

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
      
      setNewPost('')
      await loadPosts()
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
      <div className="glass px-4 py-3 flex items-center justify-between safe-top">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-95"
          >
            <FiArrowLeft className="text-gray-400" size={20} />
          </button>
          
          <button
            onClick={() => setShowInfoModal(true)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#2b6bff] to-[#0055ff]">
              {channel.avatar_url ? (
                <img src={channel.avatar_url} alt={channel.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FiUsers className="text-white" size={20} />
                </div>
              )}
            </div>
            <div>
              <h1 className="font-semibold text-white">{channel.name}</h1>
              <p className="text-xs text-gray-400">{channel.subscribers_count} подписчиков</p>
            </div>
          </button>
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

      {channel.cover_url && (
        <div 
          className="h-32 bg-cover bg-center" 
          style={{ backgroundImage: `url(${channel.cover_url})` }}
        />
      )}

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
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1 transition-colors text-xs ${
                        post.liked_by_user 
                          ? 'text-red-500' 
                          : 'text-gray-400 hover:text-red-500'
                      }`}
                    >
                      <FiHeart size={14} className={post.liked_by_user ? 'fill-current' : ''} />
                      {post.views}
                    </button>
                    <button
                      onClick={() => {
                        if (showComments === post.id) {
                          setShowComments(null)
                        } else {
                          setShowComments(post.id)
                          loadComments(post.id)
                        }
                      }}
                      className="flex items-center gap-1 text-gray-400 hover:text-[#2b6bff] transition-colors text-xs"
                    >
                      <FiMessageCircle size={14} />
                      {post.comments}
                    </button>
                  </div>
                  
                  <AnimatePresence>
                    {showComments === post.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-3 border-t border-white/10"
                      >
                        <div className="max-h-64 overflow-y-auto space-y-2 mb-3">
                          {comments.length === 0 && (
                            <p className="text-xs text-gray-500 text-center py-2">Нет комментариев</p>
                          )}
                          {comments.map((comment) => (
                            <div key={comment.id} className="flex gap-2">
                              <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-[#2b6bff] to-[#0055ff] flex items-center justify-center flex-shrink-0">
                                {comment.author_avatar ? (
                                  <img src={comment.author_avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <FiUser className="text-white" size={12} />
                                )}
                              </div>
                              <div className="flex-1">
                                <span className="text-xs font-medium text-white">{comment.author_name}</span>
                                <p className="text-xs text-gray-400 mt-0.5">{comment.content}</p>
                                <span className="text-[10px] text-gray-500 mt-0.5 block">{formatTime(comment.created_at)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Написать комментарий..."
                            className="flex-1 px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white placeholder-gray-500"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                          />
                          <button
                            onClick={() => handleAddComment(post.id)}
                            disabled={sendingComment || !newComment.trim()}
                            className="px-3 py-1.5 bg-gradient-to-r from-[#2b6bff] to-[#0055ff] rounded-xl hover:opacity-90 disabled:opacity-50 transition-all text-sm"
                          >
                            {sendingComment ? <FiLoader className="animate-spin" size={14} /> : 'Ответить'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

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

      <ChannelInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        channelId={channelId}
      />
    </div>
  )
}
