import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { assertAuthed, getUserId } from '@/lib/auth'

const Body = z.object({
  app_id: z.string().uuid(),
  props: z.record(z.any()).optional(),
  poster_url: z.string().url().optional(),
  thumb_url: z.string().url().optional(),
  aspect: z.number().positive().max(3).optional(),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try { await assertAuthed() } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }) }
  const userId = await getUserId().catch(() => null)
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = Body.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const cherryId = params.id
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Optional: verify ownership of cherry here if needed.
  const { data: attach, error } = await sb.from('cherry_vibe').insert({
    cherry_id: cherryId,
    app_id: parsed.data.app_id,
    props: parsed.data.props || {},
    poster_url: parsed.data.poster_url,
    thumb_url: parsed.data.thumb_url,
    aspect: parsed.data.aspect,
  }).select('*').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ attached: attach }, { status: 201 })
}

