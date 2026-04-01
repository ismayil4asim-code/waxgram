'use client'

import { motion } from 'framer-motion'
import { FiMessageCircle, FiUsers, FiUser } from 'react-icons/fi'

interface NavigationProps {
  currentView: 'chats' | 'channels' | 'profile'
  onViewChange: (view: 'chats' | 'channels' | 'profile') => void
}

export function Navigation({ currentView, onViewChange }: NavigationProps) {
  const navItems = [
    { id: 'chats', icon: FiMessageCircle, label: 'Чаты' },
    { id: 'channels', icon: FiUsers, label: 'Каналы' },
    { id: 'profile', icon: FiUser, label: 'Профиль' },
  ]

  return (
    <div className="hidden md:flex w-20 bg-black/30 backdrop-blur-xl border-r border-white/10 flex-col items-center py-8 z-10">
      <div className="mb-8">
        <img src="https://i.ibb.co/dsywjJ5Y/W.png" alt="WaxGram" className="w-12 h-12 rounded-full" />
      </div>
      
      <div className="flex-1 flex flex-col gap-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentView === item.id
          
          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onViewChange(item.id as any)}
              className={`relative p-3 rounded-xl transition-all ${
                isActive 
                  ? 'bg-gradient-to-r from-[#2b6bff] to-[#0055ff] text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
              title={item.label}
            >
              <Icon size={22} />
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-[#2b6bff] rounded-full"
                />
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
