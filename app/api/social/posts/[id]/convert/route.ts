import { NextRequest, NextResponse } from 'next/server'
import { buildDraftFromSocialPost } from '@/lib/social/convert'
import { createClient } from '@supabase/supabase-js'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Return pre-built draft if available
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const pre = await sb.from('social_posts').select('ingest_meta').eq('id', params.id).maybeSingle()
    const cached = pre.data?.ingest_meta?.pre_draft
    if (cached) return NextResponse.json({ draft: cached })
    const draft = await buildDraftFromSocialPost(params.id)
    return NextResponse.json({ draft })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'convert_failed' }, { status: 400 })
  }
}
