import { createClient } from '@supabase/supabase-js'

export type EventType = 'grill' | 'visit' | 'work' | 'private'

export type Booking = {
  id: string
  date: string
  name: string
  type: EventType
  title: string | null
  note: string | null
  created_at: string
}

export type GroceryItem = {
  id: string
  item: string
  added_by: string | null
  created_at: string
  is_bought: boolean
  bought_by: string | null
  bought_note: string | null
  bought_at: string | null
}

export type FundraisingPot = {
  id: string
  title: string
  description: string | null
  goal_amount: number
  raised_amount: number
  is_complete: boolean
  creator_name: string
  created_at: string
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
