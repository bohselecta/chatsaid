import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { guard } from '@/lib/server/featureGate'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const keyAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const keySvc = process.env.SUPABASE_SERVICE_ROLE_KEY || keyAnon

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const blocked = guard('SOCIAL_INGEST')
  if (blocked) return blocked
  const sb = createClient(url, keySvc)
  const { action, userId } = await req.json().catch(() => ({}))
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
  const status = action === 'pause' ? 'paused' : action === 'resume' ? 'active' : action === 'error' ? 'error' : null
  if (!status) return NextResponse.json({ error: 'invalid action' }, { status: 400 })
  const { data, error } = await sb.from('social_accounts').update({ status }).eq('id', params.id).eq('user_id', userId).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ account: data })
}
