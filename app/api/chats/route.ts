import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { userId, contactId } = await request.json()
    
    if (!userId || !contactId) {
      return NextResponse.json({ error: 'userId и contactId обязательны' }, { status: 400 })
    }
    
    // Проверяем, существует ли уже комната между этими пользователями
    const { data: existingRooms, error: findError } = await supabaseAdmin
      .from('room_members')
      .select('room_id')
      .eq('user_id', userId)
    
    if (findError) {
      console.error('Find error:', findError)
      return NextResponse.json({ error: 'Ошибка поиска комнаты' }, { status: 500 })
    }
    
    const roomIds = existingRooms?.map(r => r.room_id) || []
    
    let roomId = null
    
    if (roomIds.length > 0) {
      const { data: mutualRoom } = await supabaseAdmin
        .from('room_members')
        .select('room_id')
        .eq('user_id', contactId)
        .in('room_id', roomIds)
        .limit(1)
        .single()
      
      if (mutualRoom) {
        roomId = mutualRoom.room_id
      }
    }
    
    // Если комнаты нет, создаем новую
    if (!roomId) {
      const { data: newRoom, error: roomError } = await supabaseAdmin
        .from('rooms')
        .insert({ type: 'direct' })
        .select()
        .single()
      
      if (roomError) {
        console.error('Room creation error:', roomError)
        return NextResponse.json({ error: 'Ошибка создания комнаты' }, { status: 500 })
      }
      
      roomId = newRoom.id
      
      // Добавляем обоих пользователей в комнату
      await supabaseAdmin
        .from('room_members')
        .insert([
          { room_id: roomId, user_id: userId },
          { room_id: roomId, user_id: contactId }
        ])
    }
    
    return NextResponse.json({
      success: true,
      roomId: roomId
    })
    
  } catch (error) {
    console.error('Chat creation error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}
