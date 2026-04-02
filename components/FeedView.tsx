'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiHeart, FiMessageCircle, FiSend, FiImage, FiTrash2, FiEdit2, FiX, FiLoader, FiUser, FiClock } from 'react-icons/fi'
import { supabase } from '@/lib/supabase/client'
import { Toast } from './Toast'
import { ProfileModal } from './ProfileModal'

interface FeedPost {
  id: string
  content: string
  image_url: string | null
  author_id: string
  author_name: string
  author_avatar: string | null
  author_verified: boolean
  author_verified_type: string | null
  likes: number
  comments: number
  created_at: string
  liked_by_user?: boolean
}

interface Comment {
  id: string
  content: string
  author_id: string
  author_name: string
  author_avatar: string | null
  author_verified: boolean
  author_verified_type: string | null
  parent_id: string | null
  created_at: string
  replies?: Comment[]
}

export function FeedView() {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [newPost, setNewPost] = useState('')
  const [newImage, setNewImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [editingPost, setEditingPost] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [showComments, setShowComments] = useState<string | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editCommentContent, setEditCommentContent] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showProfileModal, setShowProfileModal] = useState<string | null>(null)
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' as 'success' | 'error' | 'info' })
  const [lastPostTime, setLastPostTime] = useState<number>(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000)
  }

  useEffect(() => {
    const userId = localStorage.getItem('temp_user_id')
    setCurrentUserId(userId)
    loadPosts()
    
    // Проверяем время последнего поста
    const lastPost = localStorage.getItem('last_post_time')
    if (lastPost) {
      setLastPostTime(parseInt(lastPost))
    }
    
    // Подписка на новые посты
    const subscription = supabase
      .channel('feed-posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feed_posts' }, () => {
        loadPosts()
      })
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadPosts = async () => {
    const userId = localStorage.getItem('temp_user_id')
    
    const { data, error } = await supabase
      .from('feed_posts')
      .select(`
        *,
        profiles:author_id (username, avatar_url, verified, verified_type),
        feed_post_likes!left (user_id)
      `)
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      const formattedPosts = data.map(post => ({
        ...post,
        author_name: post.profiles?.username || 'Пользователь',
        author_avatar: post.profiles?.avatar_url,
        author_verified: post.profiles?.verified || false,
        author_verified_type: post.profiles?.verified_type,
        liked_by_user: post.feed_post_likes?.some((like: any) => like.user_id === userId) || false
      }))
      setPosts(formattedPosts)
    }
    setLoading(false)
  }

  const canPost = () => {
    const now = Date.now()
    const fourHours = 4 * 60 * 60 * 1000
    return now - lastPostTime >= fourHours
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      showToast('Можно загружать только изображения', 'error')
      return
    }
    
    setNewImage(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSendPost = async () => {
    if (!newPost.trim() && !newImage) return
    
    if (!canPost()) {
      const hoursLeft = Math.ceil((4 * 60 * 60 * 1000 - (Date.now() - lastPostTime)) / (60 * 60 * 1000))
      showToast(`Вы можете публиковать 1 пост в 4 часа. Следующий пост через ${hoursLeft} ч.`, 'error')
      return
    }
    
    setSending(true)
    
    try {
      let imageUrl: string | null = null
      
      if (newImage) {
        const reader = new FileReader()
        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(newImage)
        })
        imageUrl = base64
      }
      
      const { data, error } = await supabase
        .from('feed_posts')
        .insert({
          author_id: currentUserId,
          content: newPost,
          image_url: imageUrl,
          likes: 0,
          comments: 0
        })
        .select()
        .single()
      
      if (error) throw error
      
      setNewPost('')
      setNewImage(null)
      setImagePreview(null)
      setLastPostTime(Date.now())
      localStorage.setItem('last_post_time', Date.now().toString())
      
      await loadPosts()
      showToast('Пост опубликован!', 'success')
    } catch (error) {
      console.error('Send post error:', error)
      showToast('Ошибка публикации', 'error')
    } finally {
      setSending(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('feed_posts')
        .delete()
        .eq('id', postId)
        .eq('author_id', currentUserId)
      
      if (error) throw error
      
      setPosts(prev => prev.filter(p => p.id !== postId))
      showToast('Пост удален', 'success')
    } catch (error) {
      console.error('Delete post error:', error)
      showToast('Ошибка удаления', 'error')
    }
  }

  const handleEditPost = async (postId: string) => {
    if (!editContent.trim()) return
    
    try {
      const { error } = await supabase
        .from('feed_posts')
        .update({ content: editContent, updated_at: new Date().toISOString() })
        .eq('id', postId)
        .eq('author_id', currentUserId)
      
      if (error) throw error
      
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, content: editContent } : p
      ))
      setEditingPost(null)
      setEditContent('')
      showToast('Пост обновлен', 'success')
    } catch (error) {
      console.error('Edit post error:', error)
      showToast('Ошибка редактирования', 'error')
    }
  }

  const handleLike = async (postId: string) => {
    const post = posts.find(p => p.id === postId)
    if (!post) return
    
    try {
      if (post.liked_by_user) {
        await supabase
          .from('feed_post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUserId)
        
        await supabase
          .from('feed_posts')
          .update({ likes: Math.max(0, post.likes - 1) })
          .eq('id', postId)
        
        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, likes: p.likes - 1, liked_by_user: false }
            : p
        ))
      } else {
        await supabase
          .from('feed_post_likes')
          .insert({ post_id: postId, user_id: currentUserId })
        
        await supabase
          .from('feed_posts')
          .update({ likes: post.likes + 1 })
          .eq('id', postId)
        
        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, likes: p.likes + 1, liked_by_user: true }
            : p
        ))
      }
    } catch (error) {
      console.error('Like error:', error)
    }
  }

  const loadComments = async (postId: string) => {
    const { data, error } = await supabase
      .from('feed_post_comments')
      .select(`
        *,
        profiles:author_id (username, avatar_url, verified, verified_type)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    
    if (!error && data) {
      const formattedComments = data.map(comment => ({
        ...comment,
        author_name: comment.profiles?.username || 'Пользователь',
        author_avatar: comment.profiles?.avatar_url,
        author_verified: comment.profiles?.verified || false,
        author_verified_type: comment.profiles?.verified_type,
        replies: []
      }))
      
      // Группируем ответы
      const threadedComments: Comment[] = []
      const commentMap = new Map()
      
      for (const comment of formattedComments) {
        commentMap.set(comment.id, comment)
        if (comment.parent_id) {
          const parent = commentMap.get(comment.parent_id)
          if (parent) {
            if (!parent.replies) parent.replies = []
            parent.replies.push(comment)
          }
        } else {
          threadedComments.push(comment)
        }
      }
      
      setComments(threadedComments)
    }
  }

  const handleAddComment = async (postId: string, parentId?: string) => {
    if (!newComment.trim()) return
    
    setSendingComment(true)
    
    try {
      const { data, error } = await supabase
        .from('feed_post_comments')
        .insert({
          post_id: postId,
          author_id: currentUserId,
          parent_id: parentId || null,
          content: newComment
        })
        .select()
        .single()
      
      if (error) throw error
      
      await supabase
        .from('feed_posts')
        .update({ comments: (posts.find(p => p.id === postId)?.comments || 0) + 1 })
        .eq('id', postId)
      
      await loadComments(postId)
      setNewComment('')
      setReplyTo(null)
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, comments: p.comments + 1 } : p
      ))
    } catch (error) {
      console.error('Comment error:', error)
    } finally {
      setSendingComment(false)
    }
  }

  const handleDeleteComment = async (commentId: string, postId: string) => {
    try {
      const { error } = await supabase
        .from('feed_post_comments')
        .delete()
        .eq('id', commentId)
        .eq('author_id', currentUserId)
      
      if (error) throw error
      
      await supabase
        .from('feed_posts')
        .update({ comments: Math.max(0, (posts.find(p => p.id === postId)?.comments || 0) - 1) })
        .eq('id', postId)
      
      await loadComments(postId)
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, comments: Math.max(0, p.comments - 1) } : p
      ))
    } catch (error) {
      console.error('Delete comment error:', error)
    }
  }

  const handleEditComment = async (commentId: string, postId: string) => {
    if (!editCommentContent.trim()) return
    
    try {
      const { error } = await supabase
        .from('feed_post_comments')
        .update({ content: editCommentContent, updated_at: new Date().toISOString() })
        .eq('id', commentId)
        .eq('author_id', currentUserId)
      
      if (error) throw error
      
      await loadComments(postId)
      setEditingComment(null)
      setEditCommentContent('')
    } catch (error) {
      console.error('Edit comment error:', error)
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

  const getVerificationBadge = (verified: boolean, type: string | null, size: 'small' | 'medium' = 'small') => {
    if (!verified) return null
    
    const sizeClass = size === 'small' ? 'w-3 h-3' : 'w-4 h-4'
    
    if (type === 'developer') {
      return <img src="/image-developer-192.png" alt="Developer" className={`${sizeClass} ml-1 inline`} title="Разработчик" />
    }
    if (type === 'moderator') {
      return <img src="/image-support-192.png" alt="Moderator" className={`${sizeClass} ml-1 inline`} title="Модератор" />
    }
    return <img src="/image-192.png" alt="Verified" className={`${sizeClass} ml-1 inline`} title="Подтвержден" />
  }

  const renderComments = (commentList: Comment[], postId: string, level: number = 0) => {
    return commentList.map((comment) => (
      <div key={comment.id} className={`ml-${level * 4} mt-2`}>
        <div className="bg-white/5 rounded-xl p-3">
          <div className="flex items-start gap-2">
            <button
              onClick={() => setShowProfileModal(comment.author_id)}
              className="flex items-center gap-2 flex-1 hover:opacity-80 transition-opacity text-left"
            >
              <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-[#2b6bff] to-[#0055ff] flex items-center justify-center flex-shrink-0">
                {comment.author_avatar ? (
                  <img src={comment.author_avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <FiUser className="text-white" size={12} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-white">{comment.author_name}</span>
                  {getVerificationBadge(comment.author_verified, comment.author_verified_type, 'small')}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{comment.content}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{formatTime(comment.created_at)}</p>
              </div>
            </button>
            
            <div className="flex gap-1">
              <button
                onClick={() => {
                  setReplyTo({ id: comment.id, name: comment.author_name })
                  setNewComment(`@${comment.author_name} `)
                }}
                className="text-[10px] text-gray-400 hover:text-[#2b6bff] transition-colors"
              >
                Ответить
              </button>
              {comment.author_id === currentUserId && (
                <>
                  <button
                    onClick={() => {
                      setEditingComment(comment.id)
                      setEditCommentContent(comment.content)
                    }}
                    className="text-[10px] text-gray-400 hover:text-yellow-400 transition-colors"
                  >
                    <FiEdit2 size={10} />
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment.id, postId)}
                    className="text-[10px] text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <FiTrash2 size={10} />
                  </button>
                </>
              )}
            </div>
          </div>
          
          {editingComment === comment.id && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={editCommentContent}
                onChange={(e) => setEditCommentContent(e.target.value)}
                className="flex-1 px-2 py-1 text-sm bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[#2b6bff] text-white"
                onKeyDown={(e) => e.key === 'Enter' && handleEditComment(comment.id, postId)}
              />
              <button
                onClick={() => handleEditComment(comment.id, postId)}
                className="px-2 py-1 bg-[#2b6bff] rounded-lg text-white text-xs"
              >
                Сохранить
              </button>
            </div>
          )}
        </div>
        {comment.replies && renderComments(comment.replies, postId, level + 1)}
      </div>
    ))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <FiLoader className="animate-spin text-[#2b6bff]" size={32} />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1a] to-[#0a0a0a]">
      <div className="glass px-4 py-3 safe-top">
        <h1 className="text-xl font-bold bg-gradient-to-r from-[#2b6bff] to-[#00c6ff] bg-clip-text text-transparent">
          Лента
        </h1>
        <p className="text-xs text-gray-400 mt-1">1 пост в 4 часа</p>
      </div>
      
      {/* Создание поста */}
      <div className="glass-card m-4 p-4">
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="Что у вас нового?"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white resize-none"
          rows={3}
        />
        
        {imagePreview && (
          <div className="relative mt-3">
            <img src={imagePreview} alt="Preview" className="max-h-40 rounded-lg" />
            <button
              onClick={() => {
                setNewImage(null)
                setImagePreview(null)
              }}
              className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70"
            >
              <FiX size={16} className="text-white" />
            </button>
          </div>
        )}
        
        <div className="flex justify-between items-center mt-3">
          <label className="p-2 bg-white/10 rounded-full cursor-pointer hover:bg-white/20 transition-colors">
            <FiImage size={20} className="text-gray-400" />
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
          
          <button
            onClick={handleSendPost}
            disabled={sending || (!newPost.trim() && !newImage)}
            className="px-6 py-2 bg-gradient-to-r from-[#2b6bff] to-[#0055ff] rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {sending ? <FiLoader className="animate-spin" size={18} /> : <FiSend size={18} />}
            Опубликовать
          </button>
        </div>
      </div>
      
      {/* Список постов */}
      <div className="flex-1 overflow-y-auto px-4 pb-20">
        <div className="space-y-4">
          {posts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4"
            >
              {/* Автор */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setShowProfileModal(post.author_id)}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#2b6bff] to-[#0055ff]">
                    {post.author_avatar ? (
                      <img src={post.author_avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiUser className="text-white" size={18} />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-white">{post.author_name}</span>
                      {getVerificationBadge(post.author_verified, post.author_verified_type, 'medium')}
                    </div>
                    <p className="text-xs text-gray-400">{formatTime(post.created_at)}</p>
                  </div>
                </button>
                
                {post.author_id === currentUserId && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingPost(post.id)
                        setEditContent(post.content)
                      }}
                      className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <FiEdit2 size={16} className="text-gray-400 hover:text-yellow-400" />
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <FiTrash2 size={16} className="text-gray-400 hover:text-red-400" />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Контент */}
              {editingPost === post.id ? (
                <div className="mb-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleEditPost(post.id)}
                      className="px-3 py-1 bg-[#2b6bff] rounded-lg text-white text-sm"
                    >
                      Сохранить
                    </button>
                    <button
                      onClick={() => {
                        setEditingPost(null)
                        setEditContent('')
                      }}
                      className="px-3 py-1 bg-white/10 rounded-lg text-white text-sm"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-200 mb-3">{post.content}</p>
              )}
              
              {/* Изображение */}
              {post.image_url && (
                <img src={post.image_url} alt="Post image" className="rounded-xl mb-3 max-h-96 object-cover" />
              )}
              
              {/* Кнопки действий */}
              <div className="flex items-center gap-4 pt-2 border-t border-white/10">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-1 text-sm transition-colors ${
                    post.liked_by_user ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                  }`}
                >
                  <FiHeart size={18} className={post.liked_by_user ? 'fill-current' : ''} />
                  {post.likes}
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
                  className="flex items-center gap-1 text-sm text-gray-400 hover:text-[#2b6bff] transition-colors"
                >
                  <FiMessageCircle size={18} />
                  {post.comments}
                </button>
              </div>
              
              {/* Комментарии */}
              <AnimatePresence>
                {showComments === post.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-white/10"
                  >
                    <div className="max-h-96 overflow-y-auto space-y-2 mb-3">
                      {comments.length === 0 && (
                        <p className="text-xs text-gray-500 text-center py-2">Нет комментариев</p>
                      )}
                      {renderComments(comments, post.id)}
                    </div>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={replyTo ? `Ответить ${replyTo.name}...` : "Написать комментарий..."}
                        className="flex-1 px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white placeholder-gray-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id, replyTo?.id)}
                      />
                      {replyTo && (
                        <button
                          onClick={() => {
                            setReplyTo(null)
                            setNewComment('')
                          }}
                          className="px-2 py-1 bg-red-500/20 rounded-lg text-red-400 text-xs"
                        >
                          Отмена
                        </button>
                      )}
                      <button
                        onClick={() => handleAddComment(post.id, replyTo?.id)}
                        disabled={sendingComment || !newComment.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-[#2b6bff] to-[#0055ff] rounded-xl hover:opacity-90 disabled:opacity-50 transition-all text-sm"
                      >
                        {sendingComment ? <FiLoader className="animate-spin" size={14} /> : 'Отправить'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {showProfileModal && (
        <ProfileModal
          isOpen={!!showProfileModal}
          onClose={() => setShowProfileModal(null)}
          userId={showProfileModal}
        />
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
