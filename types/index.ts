export interface Profile {
  id: string
  username: string | null
  phone: string | null
  avatar_url: string | null
  public_key: string | null
  created_at: string
}

export interface Message {
  id: string
  room_id: string
  sender_id: string
  encrypted_content: string
  message_type: 'text' | 'image' | 'voice'
  file_url: string | null
  sent_at: string
  sender?: Profile
}

export interface Room {
  id: string
  name: string | null
  type: 'direct' | 'group'
  created_at: string
  members?: Profile[]
}

export interface RoomMember {
  room_id: string
  user_id: string
  joined_at: string
}
