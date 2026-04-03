'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => router.replace('/'), 3000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1a] to-[#0a0a0a] text-white">
      <h1 className="text-6xl font-bold text-[#2b6bff] mb-4">404</h1>
      <p className="text-gray-400 text-lg mb-2">Страница не найдена</p>
      <p className="text-gray-600 text-sm">Перенаправление через 3 секунды...</p>
    </div>
  )
}
