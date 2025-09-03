import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    // Prefer anon key; public read is enabled via RLS. Fallback to service role if anon missing.
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
    const sb = createClient(url, anon)
    const { data, error } = await sb
      .from('vibe_apps')
      .select('allowed_origins')
      .eq('status', 'active')

    const set = new Set<string>([
      'https://vibes.diy',
      'https://*.vibes.diy',
    ])
    if (!error && data) {
      for (const row of data) {
        const arr = (row as any).allowed_origins as string[] | null
        if (Array.isArray(arr)) arr.forEach((o) => o && set.add(o))
      }
    }
    return NextResponse.json(Array.from(set))
  } catch {
    return NextResponse.json(['https://vibes.diy', 'https://*.vibes.diy'])
  }
}

