'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

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
      setError(err.message || 'Ошибка добавления контакта')
    } finally {
      setAddingUserId(null)
    }
  }

  // Блокировка скролла
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

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Затемненный фон */}
          <div
            className="fixed inset-0 bg-black/80 z-[100]"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Модальное окно */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md z-[101]"
          >
            <div className="bg-[#1a1a2e] rounded-2xl shadow-2xl overflow-hidden border border-white/10">
              {/* Заголовок */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">Найти пользователя</h2>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <FiX className="text-gray-400" size={20} />
                </button>
              </div>
              
              {/* Контент */}
              <div className="p-4">
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
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white placeholder-gray-500"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="px-4 py-2.5 bg-gradient-to-r from-[#2b6bff] to-[#0055ff] rounded-xl hover:opacity-90 disabled:opacity-50 transition-all text-white font-medium"
                  >
                    {loading ? <FiLoader className="animate-spin mx-auto" size={18} /> : 'Найти'}
                  </button>
                </div>
                
                {/* Ошибка */}
                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  </div>
                )}
                
                {/* Результаты поиска */}
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {searchResults.length === 0 && searchQuery && !loading && (
                    <div className="text-center text-gray-400 py-8">
                      <FiUser size={48} className="mx-auto mb-3 opacity-50" />
                      <p>Пользователь не найден</p>
                    </div>
                  )}
                  
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#2b6bff] to-[#0055ff] flex items-center justify-center flex-shrink-0">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                          ) : (
                            <FiUser className="text-white" size={20} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">@{user.username}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                          {user.bio && (
                            <p className="text-xs text-gray-500 truncate mt-0.5">{user.bio}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddContact(user)}
                        disabled={addingUserId === user.id}
                        className="ml-2 p-2 bg-[#2b6bff]/20 rounded-full hover:bg-[#2b6bff]/40 transition-colors flex-shrink-0 disabled:opacity-50"
                      >
                        {addingUserId === user.id ? (
                          <FiLoader className="animate-spin text-[#2b6bff]" size={16} />
                        ) : (
                          <FiUserPlus size={16} className="text-[#2b6bff]" />
                        )}
                      </button>
                    </div>
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
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 bg-gradient-to-r from-[#2b6bff] to-[#0055ff] rounded-full hover:opacity-90 transition-colors active:scale-95"
        title="Найти пользователя"
      >
        <FiUserPlus size={20} className="text-white" />
      </button>
      {mounted && createPortal(modalContent, document.body)}
    </>
  )
}
