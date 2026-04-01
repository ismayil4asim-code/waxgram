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
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      <div className="bg-black/60 backdrop-blur-xl border-t border-white/10">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id
            
            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => onViewChange(item.id as any)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  isActive 
                    ? 'text-[#2b6bff]' 
                    : 'text-gray-400'
                }`}
              >
                <Icon size={24} />
                <span className="text-xs">{item.label}</span>
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
