'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiUserPlus, FiX, FiUser } from 'react-icons/fi'
import { Toast } from './Toast'

interface User {
  id: string
  username: string
  phone: string
  avatar: string | null
  bio: string
}

interface SearchUserProps {
  onAddContact: (user: User) => void
}

export function SearchUser({ onAddContact }: SearchUserProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' as 'success' | 'error' | 'info' })

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setLoading(true)
    
    // Имитация поиска пользователей
    setTimeout(() => {
      // Демо пользователи
      const users: User[] = [
        {
          id: '1',
          username: 'vaksek',
          phone: '+7 927 101-03-60',
          avatar: 'https://i.ibb.co/zThS1F2P/photo-2026-03-29-10-46-46.jpg',
          bio: 'Тестовый пользователь'
        },
        {
          id: '2',
          username: 'waxTG_support',
          phone: '+7 800 123-45-67',
          avatar: 'https://i.ibb.co/dsywjJ5Y/W.png',
          bio: 'Официальная поддержка WaxTG'
        }
      ]
      
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone.includes(searchQuery)
      )
      
      setSearchResults(filtered)
      setLoading(false)
    }, 500)
  }

  const handleAddContact = (user: User) => {
    onAddContact(user)
    showToast(`${user.username} добавлен в контакты`, 'success')
    setSearchQuery('')
    setSearchResults([])
    setIsOpen(false)
  }

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="p-2 bg-gradient-to-r from-[#2b6bff] to-[#0055ff] rounded-full hover:opacity-90 transition-colors"
        title="Найти пользователя"
      >
        <FiUserPlus size={20} className="text-white" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 p-4"
            >
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Найти пользователя</h2>
                  <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
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
                      placeholder="Введите username или телефон..."
                      className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white"
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="px-4 py-2 bg-gradient-to-r from-[#2b6bff] to-[#0055ff] rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    {loading ? '...' : 'Найти'}
                  </button>
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {searchResults.map((user) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#2b6bff] to-[#0055ff] flex items-center justify-center">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                          ) : (
                            <FiUser className="text-white" size={20} />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-white">@{user.username}</h3>
                          <p className="text-xs text-gray-400">{user.phone}</p>
                          <p className="text-xs text-gray-500">{user.bio}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddContact(user)}
                        className="p-2 bg-[#2b6bff]/20 rounded-full hover:bg-[#2b6bff]/40 transition-colors"
                      >
                        <FiUserPlus size={16} className="text-[#2b6bff]" />
                      </button>
                    </motion.div>
                  ))}
                </div>
                
                {searchResults.length === 0 && searchQuery && !loading && (
                  <p className="text-center text-gray-400 py-4">Пользователь не найден</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ show: false, message: '', type: 'info' })}
      />
    </>
  )
}