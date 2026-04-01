'use client'

import { motion } from 'framer-motion'
import { FiMessageCircle, FiUsers, FiUser, FiShield } from 'react-icons/fi'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface MobileNavigationProps {
  currentView: 'chats' | 'channels' | 'profile' | 'admin'
  onViewChange: (view: 'chats' | 'channels' | 'profile' | 'admin') => void
}

export function MobileNavigation({ currentView, onViewChange }: MobileNavigationProps) {
  const [isDeveloper, setIsDeveloper] = useState(false)

  useEffect(() => {
    const checkDeveloper = async () => {
      const userId = localStorage.getItem('temp_user_id')
      if (userId) {
        const { data } = await supabase
          .from('profiles')
          .select('verified, verified_type')
          .eq('id', userId)
          .single()
        
        if (data?.verified && data?.verified_type === 'developer') {
          setIsDeveloper(true)
        }
      }
    }
    checkDeveloper()
  }, [])

  const navItems = [
    { id: 'chats', icon: FiMessageCircle, label: 'Чаты' },
    { id: 'channels', icon: FiUsers, label: 'Каналы' },
    { id: 'profile', icon: FiUser, label: 'Профиль' },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 safe-bottom z-50">
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
                isActive ? 'text-[#2b6bff]' : 'text-gray-400'
              }`}
            >
              <Icon size={24} />
              <span className="text-xs">{item.label}</span>
            </motion.button>
          )
        })}
        
        {isDeveloper && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onViewChange('admin')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              currentView === 'admin' ? 'text-purple-400' : 'text-gray-400'
            }`}
          >
            <FiShield size={24} />
            <span className="text-xs">Админ</span>
          </motion.button>
        )}
      </div>
    </div>
  )
}
