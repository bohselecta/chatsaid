import { createClient } from '@supabase/supabase-js'
import { VH_BACKGROUNDS, VH_DESKS, VH_START_ITEMS } from '@/lib/virtual/homeAssets'

type VirtualHomeRow = {
  user_id: string
  background_url: string
  desk_url: string
  items: any
  updated_at: string | null
}

function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

export async function getOrInitHome(userId: string): Promise<VirtualHomeRow> {
  const sb = createServerSupabase()
  const { data, error } = await sb
    .from('virtual_home')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (!error && data) return data as VirtualHomeRow

  const bg = VH_BACKGROUNDS[0].fallback
  const desk = VH_DESKS[0].fallback
  const items = VH_START_ITEMS

  const { data: inserted } = await sb
    .from('virtual_home')
    .insert({ user_id: userId, background_url: bg, desk_url: desk, items })
    .select('*')
    .single()

  return inserted as VirtualHomeRow
}

export async function updateHomeItems(userId: string, items: any) {
  const sb = createServerSupabase()
  await sb
    .from('virtual_home')
    .update({ items, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
}

export async function updateHomeAppearance(userId: string, patch: { background_url?: string; desk_url?: string }) {
  const sb = createServerSupabase()
  await sb
    .from('virtual_home')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
}
