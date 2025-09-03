import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { guard } from '@/lib/server/featureGate'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// GET /api/social/rules?userId=...&accountId=...
export async function GET(req: NextRequest) {
  const blocked = guard('SOCIAL_INGEST')
  if (blocked) return blocked
  const sb = createClient(url, key)
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
  const accountId = searchParams.get('accountId')

  // Verify ownership via social_accounts
  let accQ = sb.from('social_accounts').select('id').eq('user_id', userId)
  if (accountId) accQ = accQ.eq('id', accountId)
  const { data: accounts, error: accErr } = await accQ
  if (accErr) return NextResponse.json({ error: accErr.message }, { status: 500 })
  const ids = (accounts || []).map((a: any) => a.id)
  if (!ids.length) return NextResponse.json({ rules: [] })

  const { data: rules, error } = await sb.from('import_rules').select('*').in('account_id', ids)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rules: rules || [] })
}

// POST /api/social/rules
// { userId, accountId, persona_slug, branch, filters, image_policy, auto_convert }
export async function POST(req: NextRequest) {
  const blocked = guard('SOCIAL_INGEST')
  if (blocked) return blocked
  const sb = createClient(url, key)
  const body = await req.json().catch(() => ({}))
  const { userId, accountId } = body || {}
  if (!userId || !accountId) return NextResponse.json({ error: 'userId and accountId required' }, { status: 400 })

  // Ownership check
  const { data: own, error: ownErr } = await sb.from('social_accounts').select('id').eq('id', accountId).eq('user_id', userId).maybeSingle()
  if (ownErr) return NextResponse.json({ error: ownErr.message }, { status: 500 })
  if (!own) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const payload: any = {
    account_id: accountId,
    persona_slug: body.persona_slug ?? null,
    branch: body.branch ?? null,
    filters: body.filters ?? {},
    image_policy: body.image_policy ?? 'suggest',
    auto_convert: !!body.auto_convert,
  }

  // Upsert manually (no unique constraint)
  const { data: existing } = await sb.from('import_rules').select('id').eq('account_id', accountId).maybeSingle()
  if (existing?.id) {
    const { data, error } = await sb.from('import_rules').update(payload).eq('id', existing.id).select('*').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ rule: data })
  } else {
    const { data, error } = await sb.from('import_rules').insert(payload).select('*').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ rule: data })
  }
}

