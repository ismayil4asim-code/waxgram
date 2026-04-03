'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1a] to-[#0a0a0a] text-white">
      <h1 className="text-6xl font-bold text-[#2b6bff] mb-4">500</h1>
      <p className="text-gray-400 text-lg mb-2">Что-то пошло не так</p>
      <button
        onClick={reset}
        className="mt-4 px-6 py-2 bg-[#2b6bff] rounded-xl hover:opacity-90 transition-opacity"
      >
        Попробовать снова
      </button>
    </div>
  )
}
