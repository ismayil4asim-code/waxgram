'use client'

import { useState } from 'react'
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
      
      // Исключаем текущего пользователя
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
      
      // Закрываем модальное окно после успешного добавления
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

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 bg-gradient-to-r from-[#2b6bff] to-[#0055ff] rounded-full hover:opacity-90 transition-colors"
        title="Найти пользователя"
      >
        <FiUserPlus size={20} className="text-white" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md z-50 p-4"
            >
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Найти пользователя</h2>
                  <button 
                    onClick={() => setIsOpen(false)} 
                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <FiX className="text-gray-400" size={20} />
                  </button>
                </div>
                
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
                    className="px-4 py-3 bg-gradient-to-r from-[#2b6bff] to-[#0055ff] rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    {loading ? <FiLoader className="animate-spin" size={20} /> : 'Найти'}
                  </button>
                </div>
                
                {error && (
                  <p className="text-red-400 text-sm text-center mb-4">{error}</p>
                )}
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {searchResults.length === 0 && searchQuery && !loading && (
                    <p className="text-center text-gray-400 py-8">Пользователь не найден</p>
                  )}
                  
                  {searchResults.map((user) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors"
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
                        className="ml-2 p-2 bg-[#2b6bff]/20 rounded-full hover:bg-[#2b6bff]/40 transition-colors flex-shrink-0 disabled:opacity-50"
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
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
