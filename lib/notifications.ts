export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

export function showNotification(title: string, body: string, icon?: string, onClick?: () => void) {
  if (typeof window === 'undefined') return
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const notification = new Notification(title, {
    body,
    icon: icon || 'https://i.ibb.co/dsywjJ5Y/W.png',
    badge: 'https://i.ibb.co/dsywjJ5Y/W.png',
    silent: false,
  })

  if (onClick) {
    notification.onclick = () => { onClick(); notification.close() }
  }

  setTimeout(() => notification.close(), 5000)
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') return null
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null

  try {
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  } catch (error) {
    console.error('Service Worker registration failed:', error)
    return null
  }
}

export async function subscribeToPushNotifications(userId: string): Promise<PushSubscription | null> {
  if (typeof window === 'undefined') return null

  try {
    const registration = await registerServiceWorker()
    if (!registration) return null

    const granted = await requestNotificationPermission()
    if (!granted) return null

    const existing = await registration.pushManager.getSubscription()
    const subscription = existing ?? await registration.pushManager.subscribe({
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

async function saveSubscription(userId: string, subscription: PushSubscription): Promise<void> {
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
