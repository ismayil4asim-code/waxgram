'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiUpload, FiUsers } from 'react-icons/fi'

interface CreateChannelModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (channel: any) => void
}

export function CreateChannelModal({ isOpen, onClose, onCreate }: CreateChannelModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)

  const handleSubmit = () => {
    if (!name.trim()) return
    
    const newChannel = {
      id: Date.now().toString(),
      name: name.trim(),
      description: description.trim() || 'Нет описания',
      subscribers: 1,
      avatar: avatar,
      isOwner: true,
      lastPost: null
    }
    
    onCreate(newChannel)
    setName('')
    setDescription('')
    setAvatar(null)
    onClose()
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatar(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 p-4"
          >
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Создать канал</h2>
                <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                  <FiX className="text-gray-400" size={20} />
                </button>
              </div>
              
              {/* Avatar */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-[#2b6bff] to-[#0055ff] flex items-center justify-center">
                    {avatar ? (
                      <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <FiUsers className="text-white" size={32} />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-1 bg-[#2b6bff] rounded-full cursor-pointer hover:bg-[#0055ff] transition-colors">
                    <FiUpload size={12} className="text-white" />
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Название канала *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Введите название"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Описание</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Расскажите о канале"
                    rows={3}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#2b6bff] text-white resize-none"
                  />
                </div>
                
                <button
                  onClick={handleSubmit}
                  disabled={!name.trim()}
                  className="w-full py-3 bg-gradient-to-r from-[#2b6bff] to-[#0055ff] rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  Создать канал
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}