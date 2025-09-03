import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { guard } from '@/lib/server/featureGate'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(req: NextRequest) {
  const blocked = guard('SOCIAL_INGEST')
  if (blocked) return blocked
  const sb = createClient(url, key)
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'new'
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
  let q = sb
    .from('social_posts')
    .select('*, account:account_id(platform, handle), acc:account_id(user_id)')
    .order('created_at', { ascending: false })
  if (status) q = q.eq('review_status', status)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const filtered = (data || []).filter((row: any) => row.acc?.user_id === userId).map((row: any) => ({ ...row, acc: undefined }))
  return NextResponse.json({ posts: filtered })
}

export async function PATCH(req: NextRequest) {
  const blocked = guard('SOCIAL_INGEST')
  if (blocked) return blocked
  const sb = createClient(url, key)
  const { id, status, userId } = await req.json().catch(()=>({}))
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })
  // Verify ownership via join
  const own = await sb
    .from('social_posts')
    .select('id, account:account_id(user_id)')
    .eq('id', id).maybeSingle()
  if (own.error || own.data?.account?.user_id !== userId) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const { error } = await sb.from('social_posts').update({ review_status: status }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
