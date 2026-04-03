'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

// Ленивая загрузка тяжёлых компонентов — ускоряет первый рендер
const Navigation = dynamic(() => import('@/components/Navigation').then(m => ({ default: m.Navigation })))
const MobileNavigation = dynamic(() => import('@/components/MobileNavigation').then(m => ({ default: m.MobileNavigation })))
const FeedView = dynamic(() => import('@/components/FeedView').then(m => ({ default: m.FeedView })))
const ChatsList = dynamic(() => import('@/components/ChatsList').then(m => ({ default: m.ChatsList })))
const ChatInterface = dynamic(() => import('@/components/ChatInterface').then(m => ({ default: m.ChatInterface })))
const ProfileView = dynamic(() => import('@/components/ProfileView').then(m => ({ default: m.ProfileView })))
const ChannelsView = dynamic(() => import('@/components/ChannelsView').then(m => ({ default: m.ChannelsView })))
const CreateChannelModal = dynamic(() => import('@/components/CreateChannelModal').then(m => ({ default: m.CreateChannelModal })))
const ChannelView = dynamic(() => import('@/components/ChannelView').then(m => ({ default: m.ChannelView })))
const AdminPanel = dynamic(() => import('@/components/AdminPanel').then(m => ({ default: m.AdminPanel })))

type View = 'feed' | 'chats' | 'channels' | 'profile' | 'admin'

export default function Home() {
  const [currentView, setCurrentView] = useState<View>('feed')
  const [selectedChat, setSelectedChat] = useState<{ id: string; roomId?: string } | null>(null)
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const tempUserId = localStorage.getItem('temp_user_id')
      if (!tempUserId) {
        router.replace('/auth')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', tempUserId)
        .maybeSingle()

      if (!data) {
        localStorage.removeItem('temp_user_id')
        localStorage.removeItem('temp_email')
        localStorage.removeItem('temp_username')
        router.replace('/auth')
        return
      }

      setIsLoading(false)
    }

    checkUser()

    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()

    const observer = new ResizeObserver(checkMobile)
    observer.observe(document.body)
    return () => observer.disconnect()
  }, [router])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('temp_user_id')
    localStorage.removeItem('temp_email')
    localStorage.removeItem('temp_username')
    router.replace('/auth')
  }, [router])

  const handleSelectChat = useCallback((chatId: string, roomId?: string) => {
    setSelectedChat({ id: chatId, roomId })
  }, [])

  const handleSelectChannel = useCallback((channelId: string) => {
    setSelectedChannel(channelId)
  }, [])

  const handleBack = useCallback(() => {
    setSelectedChat(null)
    setSelectedChannel(null)
  }, [])

  const handleCreateChannel = useCallback((newChannel: any) => {
    try {
      const saved = localStorage.getItem('channels')
      const channels = saved ? JSON.parse(saved) : []
      channels.push(newChannel)
      localStorage.setItem('channels', JSON.stringify(channels))
    } catch {
      // ignore parse errors
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1a] to-[#0a0a0a]">
        <div className="w-8 h-8 border-2 border-[#2b6bff] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

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

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1a] to-[#0a0a0a] overflow-hidden">
      <Navigation currentView={currentView} onViewChange={setCurrentView} />

      <div className="flex-1 overflow-hidden">
        {currentView === 'feed' && <FeedView />}
        {currentView === 'chats' && <ChatsList onSelectChat={handleSelectChat} />}
        {currentView === 'channels' && (
          <ChannelsView
            onCreateChannel={() => setIsCreateModalOpen(true)}
            onSelectChannel={handleSelectChannel}
          />
        )}
        {currentView === 'profile' && <ProfileView onLogout={handleLogout} />}
        {currentView === 'admin' && <AdminPanel />}
      </div>

      <MobileNavigation currentView={currentView} onViewChange={setCurrentView} />

      <CreateChannelModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateChannel}
      />
    </div>
  )
}
