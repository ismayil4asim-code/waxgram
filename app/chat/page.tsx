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
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const tempUserId = localStorage.getItem('temp_user_id')
    if (!tempUserId) {
      router.push('/auth')
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
    localStorage.removeItem('temp_phone')
    router.push('/auth')
  }

  const handleSelectChat = (chatId: string) => {
    setSelectedChat(chatId)
    setCurrentView('chats')
  }

  const handleSelectChannel = (channelId: string) => {
    setSelectedChannel(channelId)
    setCurrentView('channels')
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

  // Если выбран чат
  if (selectedChat) {
    return (
      <div className={isMobile ? "min-h-screen" : "flex min-h-screen"}>
        {!isMobile && <Navigation currentView={currentView} onViewChange={setCurrentView} />}
        <div className="flex-1">
          <ChatInterface 
            chatId={selectedChat} 
            onBack={handleBack}
            isMobile={isMobile}
          />
        </div>
      </div>
    )
  }

  // Если выбран канал
  if (selectedChannel) {
    return (
      <div className={isMobile ? "min-h-screen" : "flex min-h-screen"}>
        {!isMobile && <Navigation currentView={currentView} onViewChange={setCurrentView} />}
        <div className="flex-1">
          <ChannelView 
            channelId={selectedChannel} 
            onBack={handleBack}
            isMobile={isMobile}
          />
        </div>
      </div>
    )
  }

  // Главный экран
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1a] to-[#0a0a0a]">
      <div className="hidden md:flex">
        <Navigation currentView={currentView} onViewChange={setCurrentView} />
        {currentView === 'chats' && <ChatsList onSelectChat={handleSelectChat} />}
        {currentView === 'channels' && (
          <ChannelsView 
            onCreateChannel={() => setIsCreateModalOpen(true)} 
            onSelectChannel={handleSelectChannel}
          />
        )}
        {currentView === 'profile' && <ProfileView onLogout={handleLogout} />}
      </div>
      
      <div className="md:hidden pb-20">
        {currentView === 'chats' && <ChatsList onSelectChat={handleSelectChat} />}
        {currentView === 'channels' && (
          <ChannelsView 
            onCreateChannel={() => setIsCreateModalOpen(true)} 
            onSelectChannel={handleSelectChannel}
          />
        )}
        {currentView === 'profile' && <ProfileView onLogout={handleLogout} />}
      </div>
      
      <MobileNavigation 
        currentView={currentView} 
        onViewChange={setCurrentView}
      />
      
      <CreateChannelModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateChannel}
      />
    </div>
  )
}