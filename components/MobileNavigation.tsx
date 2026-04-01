'use client'

import { motion } from 'framer-motion'
import { FiMessageCircle, FiUsers, FiUser } from 'react-icons/fi'

interface MobileNavigationProps {
  currentView: 'chats' | 'channels' | 'profile'
  onViewChange: (view: 'chats' | 'channels' | 'profile') => void
}

export function MobileNavigation({ currentView, onViewChange }: MobileNavigationProps) {
  const navItems = [
    { id: 'chats', icon: FiMessageCircle, label: 'Чаты' },
    { id: 'channels', icon: FiUsers, label: 'Каналы' },
    { id: 'profile', icon: FiUser, label: 'Профиль' },
  ]

  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 flex justify-around items-center py-2 z-50 md:hidden"
    >
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = currentView === item.id
        
        return (
          <motion.button
            key={item.id}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onViewChange(item.id as any)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              isActive ? 'text-[#2b6bff]' : 'text-gray-400'
            }`}
          >
            <Icon size={24} />
            <span className="text-xs">{item.label}</span>
          </motion.button>
        )
      })}
    </motion.div>
  )
}