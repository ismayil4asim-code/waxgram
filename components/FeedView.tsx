'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiHeart, FiMessageCircle, FiSend, FiImage, FiTrash2, FiEdit2, FiX, FiLoader, FiUser } from 'react-icons/fi'
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

function VerificationBadge({ verified, type, size = 'small' }: { verified: boolean; type: string | null; size?: 'small' | 'medium' }) {
  if (!verified) return null
  const cls = size === 'small' ? 'w-3 h-3' : 'w-4 h-4'
  const src = type === 'developer' ? '/image-developer-192.png' : type === 'moderator' ? '/image-support-192.png' : '/image-192.png'
  const title = type === 'developer' ? 'Разработчик' : type === 'moderator' ? 'Модератор' : 'Подтвержден'
  return <img src={src} alt={title} className={`${cls} ml-1 inline`} title={title} />
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
  const [commentsByPost, setCommentsByPost] = useState<Record<string, Comment[]>>({})
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null)
  const [sendingComment, setSendingComment] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showProfileModal, setShowProfileModal] = useState<string | null>(null)
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' as 'success' | 'error' | 'info' })
  const [lastPostTime, setLastPostTime] = useState<number>(0)
  // Используем ref чтобы избежать stale closure в realtime-обработчике
  const currentUserIdRef = useRef<string | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000)
  }, [])

  const loadPosts = useCallback(async (uid: string | null) => {
    const userId = uid ?? currentUserIdRef.current
    const { data, error } = await supabase
      .from('feed_posts')
      .select('*, profiles:author_id(username, avatar_url, verified, verified_type), feed_post_likes!left(user_id)')
      .order('created_at', { ascending: false })
      .limit(30) // Ограничиваем — грузим только последние 30 постов
    if (!error && data) {
      setPosts(data.map(post => ({
        ...post,
        author_name: post.profiles?.username || 'Пользователь',
        author_avatar: post.profiles?.avatar_url,
        author_verified: post.profiles?.verified || false,
        author_verified_type: post.profiles?.verified_type,
        liked_by_user: post.feed_post_likes?.some((l: any) => l.user_id === userId) || false,
      })))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const userId = localStorage.getItem('temp_user_id')
    setCurrentUserId(userId)
    currentUserIdRef.current = userId
    const lastPost = localStorage.getItem('last_post_time')
    if (lastPost) setLastPostTime(parseInt(lastPost))

    loadPosts(userId)

    // Realtime: только INSERT новых постов, не перегружаем весь список
    const sub = supabase
      .channel('feed-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feed_posts' }, async (payload) => {
        const post = payload.new as any
        // Не перезагружаем всё — добавляем один новый пост
        if (post.author_id !== currentUserIdRef.current) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url, verified, verified_type')
            .eq('id', post.author_id)
            .single()
          setPosts(prev => [{
            ...post,
            author_name: profile?.username || 'Пользователь',
            author_avatar: profile?.avatar_url,
            author_verified: profile?.verified || false,
            author_verified_type: profile?.verified_type,
            liked_by_user: false,
          }, ...prev])
        }
      })
      .subscribe()

    return () => { sub.unsubscribe() }
  }, [loadPosts])

  const canPost = () => Date.now() - lastPostTime >= 4 * 60 * 60 * 1000

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { showToast('Можно загружать только изображения', 'error'); return }
    // Проверяем размер — не больше 5MB
    if (file.size > 5 * 1024 * 1024) { showToast('Файл слишком большой (макс. 5MB)', 'error'); return }
    setNewImage(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSendPost = async () => {
    if (!newPost.trim() && !newImage) return
    if (!canPost()) {
      const h = Math.ceil((4 * 60 * 60 * 1000 - (Date.now() - lastPostTime)) / (60 * 60 * 1000))
      showToast(`Следующий пост через ${h} ч.`, 'error')
      return
    }
    setSending(true)
    try {
      let imageUrl: string | null = null
      if (newImage) {
        // Загружаем в Supabase Storage вместо base64 в БД (base64 = огромный трафик)
        const ext = newImage.name.split('.').pop()
        const path = `feed/${currentUserId}/${Date.now()}.${ext}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('feed-images')
          .upload(path, newImage, { contentType: newImage.type })
        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage.from('feed-images').getPublicUrl(uploadData.path)
          imageUrl = publicUrl
        } else {
          // Fallback — base64 если Storage недоступен
          imageUrl = await new Promise(resolve => {
            const r = new FileReader()
            r.onloadend = () => resolve(r.result as string)
            r.readAsDataURL(newImage!)
          })
        }
      }
      const { data, error } = await supabase
        .from('feed_posts')
        .insert({ author_id: currentUserId, content: newPost, image_url: imageUrl, likes: 0, comments: 0 })
        .select('*, profiles:author_id(username, avatar_url, verified, verified_type)')
        .single()
      if (error) throw error
      // Оптимистично добавляем пост — не перезагружаем весь список
      setPosts(prev => [{
        ...data,
        author_name: data.profiles?.username || 'Пользователь',
        author_avatar: data.profiles?.avatar_url,
        author_verified: data.profiles?.verified || false,
        author_verified_type: data.profiles?.verified_type,
        liked_by_user: false,
      }, ...prev])
      setNewPost(''); setNewImage(null); setImagePreview(null)
      const now = Date.now()
      setLastPostTime(now)
      localStorage.setItem('last_post_time', now.toString())
      showToast('Пост опубликован!', 'success')
    } catch { showToast('Ошибка публикации', 'error') }
    finally { setSending(false) }
  }

  const handleDeletePost = async (postId: string) => {
    const { error } = await supabase.from('feed_posts').delete().eq('id', postId).eq('author_id', currentUserId)
    if (!error) {
      setPosts(prev => prev.filter(p => p.id !== postId))
      showToast('Пост удален', 'success')
    } else { showToast('Ошибка удаления', 'error') }
  }

  const handleEditPost = async (postId: string) => {
    if (!editContent.trim()) return
    const { error } = await supabase
      .from('feed_posts')
      .update({ content: editContent, updated_at: new Date().toISOString() })
      .eq('id', postId).eq('author_id', currentUserId)
    if (!error) {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, content: editContent } : p))
      setEditingPost(null); setEditContent('')
      showToast('Пост обновлен', 'success')
    }
  }

  const handleLike = async (postId: string) => {
    const post = posts.find(p => p.id === postId)
    if (!post || !currentUserId) return
    // Оптимистичное обновление — не ждём ответа сервера
    const wasLiked = post.liked_by_user
    setPosts(prev => prev.map(p => p.id === postId
      ? { ...p, liked_by_user: !wasLiked, likes: wasLiked ? Math.max(0, p.likes - 1) : p.likes + 1 }
      : p
    ))
    try {
      if (wasLiked) {
        await Promise.all([
          supabase.from('feed_post_likes').delete().eq('post_id', postId).eq('user_id', currentUserId),
          supabase.from('feed_posts').update({ likes: Math.max(0, post.likes - 1) }).eq('id', postId),
        ])
      } else {
        await Promise.all([
          supabase.from('feed_post_likes').insert({ post_id: postId, user_id: currentUserId }),
          supabase.from('feed_posts').update({ likes: post.likes + 1 }).eq('id', postId),
        ])
      }
    } catch {
      // Откатываем при ошибке
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked_by_user: wasLiked, likes: post.likes } : p))
    }
  }

  const loadComments = useCallback(async (postId: string) => {
    // Используем кэш — не грузим повторно если уже загружены
    if (commentsByPost[postId]) return
    const { data, error } = await supabase
      .from('feed_post_comments')
      .select('*, profiles:author_id(username, avatar_url, verified, verified_type)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    if (!error && data) {
      const formatted = data.map(c => ({
        ...c,
        author_name: c.profiles?.username || 'Пользователь',
        author_avatar: c.profiles?.avatar_url,
        author_verified: c.profiles?.verified || false,
        author_verified_type: c.profiles?.verified_type,
        replies: [],
      }))
      // Строим дерево комментариев
      const map = new Map<string, Comment>()
      const roots: Comment[] = []
      for (const c of formatted) {
        map.set(c.id, c)
        if (c.parent_id && map.has(c.parent_id)) {
          map.get(c.parent_id)!.replies!.push(c)
        } else { roots.push(c) }
      }
      setCommentsByPost(prev => ({ ...prev, [postId]: roots }))
    }
  }, [commentsByPost])

  const handleAddComment = async (postId: string, parentId?: string) => {
    if (!newComment.trim() || !currentUserId) return
    setSendingComment(true)
    try {
      const { data, error } = await supabase
        .from('feed_post_comments')
        .insert({ post_id: postId, author_id: currentUserId, parent_id: parentId || null, content: newComment })
        .select('*, profiles:author_id(username, avatar_url)')
        .single()
      if (error) throw error
      // Добавляем комментарий локально — не перезагружаем
      const newC: Comment = {
        ...data,
        author_name: data.profiles?.username || 'Вы',
        author_avatar: data.profiles?.avatar_url,
        author_verified: false,
        author_verified_type: null,
        replies: [],
      }
      setCommentsByPost(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newC],
      }))
      await supabase.from('feed_posts').update({ comments: (posts.find(p => p.id === postId)?.comments || 0) + 1 }).eq('id', postId)
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: p.comments + 1 } : p))
      setNewComment(''); setReplyTo(null)
    } catch { showToast('Ошибка отправки', 'error') }
    finally { setSendingComment(false) }
  }

  const formatTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const m = Math.floor(diff / 60000)
    const h = Math.floor(m / 60)
    const d = Math.floor(h / 24)
    if (m < 1) return 'только что'
    if (m < 60) return `${m} мин назад`
    if (h < 24) return `${h} ч назад`
    return `${d} дн назад`
  }

  const renderComments = (list: Comment[], postId: string, level = 0): React.ReactNode => list.map(comment => (
    <div key={comment.id} className={level > 0 ? 'ml-4 mt-2' : 'mt-2'}>
      <div className="bg-white/5 rounded-xl p-3">
        <div className="flex items-start gap-2">
          <button onClick={() => setShowProfileModal(comment.author_id)} className="flex items-center gap-2 flex-1 hover:opacity-80 text-left">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-[#2b6bff] to-[#0055ff] flex-shrink-0 flex items-center justify-center">
              {comment.author_avatar ? <img src={comment.author_avatar} alt="" className="w-full h-full object-cover" /> : <FiUser className="text-white" size={12} />}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-white">{comment.author_name}</span>
                <VerificationBadge verified={comment.author_verified} type={comment.author_verified_type} />
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{comment.content}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{formatTime(comment.created_at)}</p>
            </div>
          </button>
          <button onClick={() => { setReplyTo({ id: comment.id, name: comment.author_name }); setNewComment(`@${comment.author_name} `) }}
            className="text-[10px] text-gray-400 hover:text-[#2b6bff]">Ответить</button>
        </div>
      </div>
      {comment.replies && comment.replies.length > 0 && renderComments(comment.replies, postId, level + 1)}
    </div>
  ))

  if (loading) return <div className="flex items-center justify-center h-full"><FiLoader className="animate-spin text-[#2b6bff]" size={32} /></div>

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1a] to-[#0a0a0a]">
      <div className="glass px-4 py-3 safe-top">
        <h1 className="text-xl font-bold bg-gradient-to-r from-[#2b6bff] to-[#00c6ff] bg-clip-text text-transparent">Лента</h1>
        <p className="text-xs text-gray-400 mt-1">1 пост в 4 часа</p>
      </div>

      <div className="glass-card m-4 p-4">
        <textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="Что у вас нового?"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white resize-none" rows={3} />
        {imagePreview && (
          <div className="relative mt-3">
            <img src={imagePreview} alt="Preview" className="max-h-40 rounded-lg" />
            <button onClick={() => { setNewImage(null); setImagePreview(null) }} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full"><FiX size={16} className="text-white" /></button>
          </div>
        )}
        <div className="flex justify-between items-center mt-3">
          <label className="p-2 bg-white/10 rounded-full cursor-pointer hover:bg-white/20 transition-colors">
            <FiImage size={20} className="text-gray-400" />
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
          <button onClick={handleSendPost} disabled={sending || (!newPost.trim() && !newImage)}
            className="px-6 py-2 bg-gradient-to-r from-[#2b6bff] to-[#0055ff] rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2">
            {sending ? <FiLoader className="animate-spin" size={18} /> : <FiSend size={18} />} Опубликовать
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-20">
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => setShowProfileModal(post.author_id)} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#2b6bff] to-[#0055ff]">
                    {post.author_avatar ? <img src={post.author_avatar} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><FiUser className="text-white" size={18} /></div>}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-white">{post.author_name}</span>
                      <VerificationBadge verified={post.author_verified} type={post.author_verified_type} size="medium" />
                    </div>
                    <p className="text-xs text-gray-400">{formatTime(post.created_at)}</p>
                  </div>
                </button>
                {post.author_id === currentUserId && (
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingPost(post.id); setEditContent(post.content) }} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><FiEdit2 size={16} className="text-gray-400" /></button>
                    <button onClick={() => handleDeletePost(post.id)} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><FiTrash2 size={16} className="text-gray-400" /></button>
                  </div>
                )}
              </div>

              {editingPost === post.id ? (
                <div className="mb-3">
                  <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={3}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white resize-none" />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => handleEditPost(post.id)} className="px-3 py-1 bg-[#2b6bff] rounded-lg text-white text-sm">Сохранить</button>
                    <button onClick={() => { setEditingPost(null); setEditContent('') }} className="px-3 py-1 bg-white/10 rounded-lg text-white text-sm">Отмена</button>
                  </div>
                </div>
              ) : <p className="text-gray-200 mb-3">{post.content}</p>}

              {post.image_url && <img src={post.image_url} alt="" className="rounded-xl mb-3 max-h-96 w-full object-cover" />}

              <div className="flex items-center gap-4 pt-2 border-t border-white/10">
                <button onClick={() => handleLike(post.id)} className={`flex items-center gap-1 text-sm transition-colors ${post.liked_by_user ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}>
                  <FiHeart size={18} className={post.liked_by_user ? 'fill-current' : ''} /> {post.likes}
                </button>
                <button onClick={() => { const open = showComments === post.id; setShowComments(open ? null : post.id); if (!open) loadComments(post.id) }}
                  className="flex items-center gap-1 text-sm text-gray-400 hover:text-[#2b6bff] transition-colors">
                  <FiMessageCircle size={18} /> {post.comments}
                </button>
              </div>

              <AnimatePresence>
                {showComments === post.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-white/10">
                    <div className="max-h-64 overflow-y-auto space-y-1 mb-3">
                      {!commentsByPost[post.id] && <p className="text-xs text-gray-500 text-center py-2"><FiLoader className="animate-spin inline mr-1" size={12} />Загрузка...</p>}
                      {commentsByPost[post.id]?.length === 0 && <p className="text-xs text-gray-500 text-center py-2">Нет комментариев</p>}
                      {commentsByPost[post.id] && renderComments(commentsByPost[post.id], post.id)}
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)}
                        placeholder={replyTo ? `Ответить ${replyTo.name}...` : 'Написать комментарий...'}
                        className="flex-1 px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white placeholder-gray-500"
                        onKeyDown={e => e.key === 'Enter' && handleAddComment(post.id, replyTo?.id)} />
                      {replyTo && <button onClick={() => { setReplyTo(null); setNewComment('') }} className="px-2 py-1 bg-red-500/20 rounded-lg text-red-400 text-xs">✕</button>}
                      <button onClick={() => handleAddComment(post.id, replyTo?.id)} disabled={sendingComment || !newComment.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-[#2b6bff] to-[#0055ff] rounded-xl hover:opacity-90 disabled:opacity-50 text-sm">
                        {sendingComment ? <FiLoader className="animate-spin" size={14} /> : 'Отправить'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {showProfileModal && <ProfileModal isOpen={!!showProfileModal} onClose={() => setShowProfileModal(null)} userId={showProfileModal} />}
      <Toast message={toast.message} type={toast.type} isVisible={toast.show} onClose={() => setToast({ show: false, message: '', type: 'info' })} />
    </div>
  )
}
