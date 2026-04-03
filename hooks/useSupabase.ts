'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Profile {
  id: string
  username: string | null
  avatar_url: string | null
  online: boolean
}

export function useSupabase() {
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (id: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, online')
      .eq('id', id)
      .single()
    if (data) setProfile(data)
  }, [])

  useEffect(() => {
    const id = localStorage.getItem('temp_user_id')
    setUserId(id)
    if (id) {
      loadProfile(id).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [loadProfile])

  return { userId, profile, loading, supabase }
}
