import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'WaxGram | Безопасный мессенджер',
  description: 'Сквозное шифрование, приватность и безопасное общение',
  manifest: '/manifest.json',
  icons: {
    icon: 'https://i.ibb.co/dsywjJ5Y/W.png',
    apple: 'https://i.ibb.co/dsywjJ5Y/W.png',
  }
}

export const viewport: Viewport = {
  themeColor: '#2b6bff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <head>
        <link rel="icon" href="https://i.ibb.co/dsywjJ5Y/W.png" />
        <link rel="apple-touch-icon" href="https://i.ibb.co/dsywjJ5Y/W.png" />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1a] to-[#0a0a0a]">
          {children}
        </div>
      </body>
    </html>
  )
}