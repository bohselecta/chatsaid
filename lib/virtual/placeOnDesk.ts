import { createClient } from '@supabase/supabase-js'

function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

export async function placeOnDesk(userId: string, item: { id: string; src: string; alt: string; xPct?: number; yPct?: number; widthPct?: number; z?: number }) {
  const sb = createServerSupabase()
  const { data } = await sb.from('virtual_home').select('items').eq('user_id', userId).maybeSingle()
  const items = (data?.items as any[]) || []
  const next = [
    ...items,
    {
      xPct: 40,
      yPct: 72,
      widthPct: 12,
      ...item,
    },
  ]
  await sb.from('virtual_home').update({ items: next, updated_at: new Date().toISOString() }).eq('user_id', userId)
  return next
}

