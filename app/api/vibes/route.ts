import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/auth'

const CreateSchema = z.object({
  slug: z.string().min(2).max(64),
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  provider: z.enum(['remote-url', 'npm-embed']),
  embed_url: z.string().url().optional(),
  npm_pkg: z.string().optional(),
  entry_name: z.string().optional(),
  allowed_origins: z.array(z.string()).optional(),
  capabilities: z.record(z.any()).optional(),
  status: z.enum(['draft', 'active', 'blocked']).optional(),
})

export async function GET() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await sb.from('vibe_apps').select('*').eq('status', 'active')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ apps: data || [] })
}

export async function POST(req: NextRequest) {
  // Require admin
  try { await requireAdmin() } catch (e: any) {
    const msg = e?.message === 'forbidden' ? 'forbidden' : 'unauthorized'
    const code = msg === 'forbidden' ? 403 : 401
    return NextResponse.json({ error: msg }, { status: code })
  }
  const body = await req.json().catch(() => null)
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await sb.from('vibe_apps').insert(parsed.data).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ app: data }, { status: 201 })
}
