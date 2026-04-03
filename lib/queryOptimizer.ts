import { supabase } from './supabase/client'

export const MESSAGES_PAGE_SIZE = 50
export const FEED_PAGE_SIZE = 20
export const COMMENTS_PAGE_SIZE = 30

// Простой in-memory кэш с TTL
const cache = new Map<string, { data: any; expires: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 минут

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (entry && entry.expires > Date.now()) return entry.data as T
  cache.delete(key)
  return null
}

export function setCache(key: string, data: any, ttl = CACHE_TTL) {
  // Ограничиваем размер кэша — не более 100 записей
  if (cache.size >= 100) {
    const firstKey = cache.keys().next().value
    if (firstKey) cache.delete(firstKey)
  }
  cache.set(key, { data, expires: Date.now() + ttl })
}

export function invalidateCache(prefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key)
  }
}

export function clearCache() {
  cache.clear()
}

export async function loadMessagesPaginated(roomId: string, page = 0, limit = MESSAGES_PAGE_SIZE) {
  const cacheKey = `messages_${roomId}_${page}`
  const cached = getCached<any>(cacheKey)
  if (cached) return cached

  const from = page * limit
  const to = from + limit - 1

  const { data, error, count } = await supabase
    .from('messages')
    .select('*, message_reads(user_id)', { count: 'exact' })
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (!error && data) {
    const result = { data, count }
    setCache(cacheKey, result)
    return result
  }

  return { data: [], count: 0 }
}

export async function loadFeedPaginated(page = 0, limit = FEED_PAGE_SIZE) {
  const cacheKey = `feed_${page}`
  const cached = getCached<any>(cacheKey)
  if (cached) return cached

  const from = page * limit
  const to = from + limit - 1

  const { data, error, count } = await supabase
    .from('feed_posts')
    .select('*, profiles(username, avatar_url, verified, verified_type)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (!error && data) {
    const result = { data, count }
    setCache(cacheKey, result)
    return result
  }

  return { data: [], count: 0 }
}

export async function loadProfileOptimized(userId: string) {
  const cacheKey = `profile_${userId}`
  const cached = getCached<any>(cacheKey)
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
