import { supabase } from './supabase/client'

// Пагинация для сообщений
export const MESSAGES_PAGE_SIZE = 50
export const FEED_PAGE_SIZE = 20
export const COMMENTS_PAGE_SIZE = 30

// Кэш для часто запрашиваемых данных
const cache = new Map<string, { data: any; expires: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 минут

export function getCached<T>(key: string): T | null {
  const cached = cache.get(key)
  if (cached && cached.expires > Date.now()) {
    return cached.data
  }
  cache.delete(key)
  return null
}

export function setCache(key: string, data: any, ttl: number = CACHE_TTL) {
  cache.set(key, { data, expires: Date.now() + ttl })
}

export function clearCache() {
  cache.clear()
}

// Оптимизированная загрузка сообщений с пагинацией
export async function loadMessagesPaginated(roomId: string, page: number = 0, limit: number = MESSAGES_PAGE_SIZE) {
  const from = page * limit
  const to = from + limit - 1
  
  const cacheKey = `messages_${roomId}_${page}`
  const cached = getCached(cacheKey)
  if (cached) return cached
  
  const { data, error, count } = await supabase
    .from('messages')
    .select('*, message_reads(user_id)', { count: 'exact' })
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .range(from, to)
  
  if (!error && data) {
    setCache(cacheKey, { data, count })
    return { data, count }
  }
  
  return { data: [], count: 0 }
}

// Оптимизированная загрузка постов ленты
export async function loadFeedPaginated(page: number = 0, limit: number = FEED_PAGE_SIZE) {
  const from = page * limit
  const to = from + limit - 1
  
  const cacheKey = `feed_${page}`
  const cached = getCached(cacheKey)
  if (cached) return cached
  
  const { data, error, count } = await supabase
    .from('feed_posts')
    .select('*, profiles(username, avatar_url, verified, verified_type)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)
  
  if (!error && data) {
    setCache(cacheKey, { data, count })
    return { data, count }
  }
  
  return { data: [], count: 0 }
}

// Оптимизированная загрузка профиля
export async function loadProfileOptimized(userId: string) {
  const cacheKey = `profile_${userId}`
  const cached = getCached(cacheKey)
  if (cached) return cached
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, first_name, last_name, avatar_url, bio, verified, verified_type, online, last_seen, created_at')
    .eq('id', userId)
    .single()
  
  if (!error && data) {
    setCache(cacheKey, data)
    return data
  }
  
  return null
}
