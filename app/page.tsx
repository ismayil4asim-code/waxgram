'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/Navigation'
import { MobileNavigation } from '@/components/MobileNavigation'
import { ChatsList } from '@/components/ChatsList'
import { ChatInterface } from '@/components/ChatInterface'
import { ProfileView } from '@/components/ProfileView'
import { ChannelsView } from '@/components/ChannelsView'
import { CreateChannelModal } from '@/components/CreateChannelModal'
import { ChannelView } from '@/components/ChannelView'

export default function Home() {
  const [currentView, setCurrentView] = useState<'chats' | 'channels' | 'profile'>('chats')
  const [selectedChat, setSelectedChat] = useState<{ id: string; roomId?: string } | null>(null)
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const tempUserId = localStorage.getItem('temp_user_id')
    if (!tempUserId) {
      router.push('/auth')
    } else {
      setIsLoading(false)
    }
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('temp_user_id')
    localStorage.removeItem('temp_email')
    localStorage.removeItem('temp_username')
    router.push('/auth')
  }

  const handleSelectChat = (chatId: string, roomId?: string) => {
    setSelectedChat({ id: chatId, roomId })
  }

  const handleSelectChannel = (channelId: string) => {
    setSelectedChannel(channelId)
  }

  const handleBack = () => {
    setSelectedChat(null)
    setSelectedChannel(null)
  }

  const handleCreateChannel = (newChannel: any) => {
    const savedChannels = localStorage.getItem('channels')
    const channels = savedChannels ? JSON.parse(savedChannels) : []
    channels.push(newChannel)
    localStorage.setItem('channels', JSON.stringify(channels))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1a] to-[#0a0a0a]">
        <div className="spinner"></div>
      </div>
    )
  }

  // Открытый чат
  if (selectedChat) {
    return (
      <div className="h-screen">
        <ChatInterface 
          chatId={selectedChat.id} 
          roomId={selectedChat.roomId}
          onBack={handleBack}
          isMobile={isMobile}
        />
      </div>
    )
  }

  // Открытый канал
  if (selectedChannel) {
    return (
      <div className="h-screen">
        <ChannelView 
          channelId={selectedChannel} 
          onBack={handleBack}
          isMobile={isMobile}
        />
      </div>
    )
  }

  // Главный экран
  return (
    <div className="flex h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1a] to-[#0a0a0a] overflow-hidden">
      {/* Десктопная навигация (скрыта на мобильных) */}
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
      
      {/* Основной контент */}
      <div className="flex-1 overflow-hidden">
        {currentView === 'chats' && (
          <ChatsList onSelectChat={handleSelectChat} />
        )}
        {currentView === 'channels' && (
          <ChannelsView 
            onCreateChannel={() => setIsCreateModalOpen(true)} 
            onSelectChannel={handleSelectChannel}
          />
        )}
        {currentView === 'profile' && (
          <ProfileView onLogout={handleLogout} />
        )}
      </div>
      
      {/* Мобильная навигация снизу */}
      <MobileNavigation 
        currentView={currentView} 
        onViewChange={setCurrentView}
      />
      
      {/* Модальное окно создания канала */}
      <CreateChannelModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateChannel}
      />
    </div>
  )
}
