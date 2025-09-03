import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { fetchOEmbed } from '@/lib/media/oembed'
import { assertAuthed, getUserId } from '@/lib/auth'

const Body = z.object({ url: z.string().url() })

export async function POST(req: NextRequest) {
  try {
    await assertAuthed()
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const userId = await getUserId().catch(() => null)
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { url } = Body.parse(await req.json())
  const { html, meta } = await fetchOEmbed(url)

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await sb
    .from('media_assets')
    .insert({
      owner_id: userId,
      storage_path: '',
      media_type: 'oembed',
      mime: 'text/html',
      width: meta.width,
      height: meta.height,
      oembed_url: url,
      oembed_html: html,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ media: data }, { status: 201 })
}

