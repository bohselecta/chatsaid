import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { guard } from '@/lib/server/featureGate'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const keyAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const keySvc = process.env.SUPABASE_SERVICE_ROLE_KEY || keyAnon

export async function GET(req: NextRequest) {
  const blocked = guard('SOCIAL_INGEST')
  if (blocked) return blocked
  const sb = createClient(url, keySvc)
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
  const { data, error } = await sb.from('social_accounts').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ accounts: data || [] })
}

export async function POST(req: NextRequest) {
  const blocked = guard('SOCIAL_INGEST')
  if (blocked) return blocked
  const sb = createClient(url, keySvc)
  const body = await req.json().catch(() => ({}))
  const { userId, platform, handle, config } = body || {}
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
  if (!platform || !handle) return NextResponse.json({ error: 'platform and handle required' }, { status: 400 })
  const { data, error } = await sb.from('social_accounts').insert({ user_id: userId, platform, handle, config: config || {} }).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ account: data })
}
