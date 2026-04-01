// Функция для запроса разрешения на уведомления
export async function requestNotificationPermission() {
  if (typeof window === 'undefined') return false
  
  if (!('Notification' in window)) {
    console.log('Браузер не поддерживает уведомления')
    return false
  }

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

// Функция для показа уведомления
export function showNotification(title: string, body: string, icon?: string, onClick?: () => void) {
  if (typeof window === 'undefined') return
  
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return
  }

  const options: NotificationOptions = {
    body: body,
    icon: icon || 'https://i.ibb.co/dsywjJ5Y/W.png',
    badge: 'https://i.ibb.co/dsywjJ5Y/W.png',
    silent: false,
  }
  
  // vibrate доступен только в некоторых браузерах
  if ('vibrate' in navigator) {
    // @ts-ignore - vibrate существует в некоторых окружениях
    options.vibrate = [200, 100, 200]
  }

  const notification = new Notification(title, options)

  if (onClick) {
    notification.onclick = () => {
      onClick()
      notification.close()
    }
  }

  setTimeout(() => notification.close(), 5000)
}

// Функция для регистрации Service Worker
export async function registerServiceWorker() {
  if (typeof window === 'undefined') return null
  
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered')
      return registration
    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  }
  return null
}

// Функция для подписки на Push-уведомления
export async function subscribeToPushNotifications(userId: string) {
  if (typeof window === 'undefined') return null

  try {
    const registration = await registerServiceWorker()
    if (!registration) return null

    const permission = await requestNotificationPermission()
    if (!permission) return null

    const existingSubscription = await registration.pushManager.getSubscription()
    if (existingSubscription) {
      await saveSubscription(userId, existingSubscription)
      return existingSubscription
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    })

    await saveSubscription(userId, subscription)
    return subscription
  } catch (error) {
    console.error('Push subscription failed:', error)
    return null
  }
}

async function saveSubscription(userId: string, subscription: PushSubscription) {
  try {
    await fetch('/api/auth/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, subscription }),
    })
  } catch (error) {
    console.error('Failed to save subscription:', error)
  }
}
