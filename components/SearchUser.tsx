'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiUserPlus, FiX, FiUser, FiLoader } from 'react-icons/fi'
import { supabase } from '@/lib/supabase/client'

interface User {
  id: string
  username: string
  email: string
  avatar_url: string | null
  bio: string
}

interface SearchUserProps {
  onAddContact: (user: User) => Promise<void>
}

export function SearchUser({ onAddContact }: SearchUserProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [addingUserId, setAddingUserId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setLoading(true)
    setError('')
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, email, avatar_url, bio')
        .ilike('username', `%${searchQuery}%`)
        .limit(10)
      
      if (error) throw error
      
      const currentUserId = localStorage.getItem('temp_user_id')
      const filtered = (data || []).filter(user => user.id !== currentUserId)
      
      setSearchResults(filtered)
    } catch (error) {
      console.error('Search error:', error)
      setError('Ошибка поиска')
    } finally {
      setLoading(false)
    }
  }

  const handleAddContact = async (user: User) => {
    const currentUserId = localStorage.getItem('temp_user_id')
    
    if (!currentUserId) {
      setError('Пользователь не авторизован')
      return
    }
    
    if (currentUserId === user.id) {
      setError('Нельзя добавить самого себя')
      return
    }
    
    setAddingUserId(user.id)
    setError('')
    
    try {
      await onAddContact(user)
      setIsOpen(false)
      setSearchQuery('')
      setSearchResults([])
    } catch (err: any) {
      console.error('Add contact error:', err)
      setError(err.message || 'Ошибка добавления контакта')
    } finally {
      setAddingUserId(null)
    }
  }

  // Закрываем по Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  // Блокируем скролл при открытом модальном окне
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 bg-gradient-to-r from-[#2b6bff] to-[#0055ff] rounded-full hover:opacity-90 transition-colors active:scale-95"
        title="Найти пользователя"
      >
        <FiUserPlus size={20} className="text-white" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Затемненный фон */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Модальное окно по центру */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[calc(100%-32px)] max-w-md z-50"
            >
              <div className="glass-card p-5 max-h-[85vh] overflow-y-auto">
                {/* Заголовок */}
                <div className="flex items-center justify-between mb-4 sticky top-0 bg-inherit pb-2">
                  <h2 className="text-xl font-bold text-white">Найти пользователя</h2>
                  <button 
                    onClick={() => setIsOpen(false)} 
                    className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-95"
                  >
                    <FiX className="text-gray-400" size={20} />
                  </button>
                </div>
                
                {/* Поисковая строка */}
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Введите username..."
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white text-base"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="px-5 py-3 bg-gradient-to-r from-[#2b6bff] to-[#0055ff] rounded-xl hover:opacity-90 disabled:opacity-50 transition-all active:scale-95"
                  >
                    {loading ? <FiLoader className="animate-spin" size={20} /> : 'Найти'}
                  </button>
                </div>
                
                {/* Ошибка */}
                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  </div>
                )}
                
                {/* Результаты поиска */}
                <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                  {searchResults.length === 0 && searchQuery && !loading && (
                    <div className="text-center text-gray-400 py-8">
                      <FiUser size={48} className="mx-auto mb-3 opacity-50" />
                      <p>Пользователь не найден</p>
                      <p className="text-xs mt-1">Проверьте правильность написания</p>
                    </div>
                  )}
                  
                  {searchResults.map((user) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors active:bg-white/10"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[#2b6bff] to-[#0055ff] flex items-center justify-center flex-shrink-0">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                          ) : (
                            <FiUser className="text-white" size={24} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white truncate">@{user.username}</h3>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                          {user.bio && (
                            <p className="text-xs text-gray-500 truncate mt-1">{user.bio}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddContact(user)}
                        disabled={addingUserId === user.id}
                        className="ml-2 p-2 bg-[#2b6bff]/20 rounded-full hover:bg-[#2b6bff]/40 transition-colors flex-shrink-0 disabled:opacity-50 active:scale-95"
                      >
                        {addingUserId === user.id ? (
                          <FiLoader className="animate-spin text-[#2b6bff]" size={16} />
                        ) : (
                          <FiUserPlus size={16} className="text-[#2b6bff]" />
                        )}
                      </button>
                    </motion.div>
                  ))}
                </div>
                
                {/* Подсказка */}
                {searchResults.length === 0 && !searchQuery && !loading && (
                  <div className="text-center text-gray-500 py-8">
                    <FiSearch size={48} className="mx-auto mb-3 opacity-50" />
                    <p>Введите username для поиска</p>
                    <p className="text-xs mt-1">Например: john_doe</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
