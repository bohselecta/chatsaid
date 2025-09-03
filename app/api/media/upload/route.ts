import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { getBlurhash } from '@/lib/media/blurhash'
import { getDominantColor } from '@/lib/media/colors'
import { moderateMedia } from '@/lib/media/moderation'
import { assertAuthed, getUserId } from '@/lib/auth'

export const runtime = 'nodejs'

const MetaSchema = z.object({
  altText: z.string().min(3).max(300).optional(),
  caption: z.string().max(500).optional(),
  aiGenerated: z.boolean().optional(),
  aiModel: z.string().max(120).optional(),
  aiPrompt: z.string().max(2000).optional(),
})

export async function POST(req: NextRequest) {
  try {
    await assertAuthed()
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const userId = await getUserId().catch(() => null)
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const contentType = req.headers.get('content-type') || ''
  if (!contentType.startsWith('multipart/form-data')) {
    return NextResponse.json({ error: 'multipart/form-data required' }, { status: 400 })
  }

  const form = await req.formData()
  const file = form.get('file') as File | null
  const metaRaw = form.get('meta')
  const meta = MetaSchema.parse(metaRaw ? JSON.parse(String(metaRaw)) : {})

  if (!file) return NextResponse.json({ error: 'file missing' }, { status: 400 })
  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: 'file too large' }, { status: 413 })
  }

  const mime = file.type || 'application/octet-stream'
  const mediaType = mime.startsWith('image/') ? 'image' : mime.startsWith('video/') ? 'video' : null
  if (!mediaType) return NextResponse.json({ error: 'unsupported type' }, { status: 415 })

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const key = `${userId}/${Date.now()}-${(file as any).name || 'upload'}`
  const buf = Buffer.from(await file.arrayBuffer())

  let width: number | undefined,
    height: number | undefined,
    blurhash: string | undefined,
    dominant: string | undefined

  if (mediaType === 'image') {
    const info = await getBlurhash(buf, mime)
    width = info.width
    height = info.height
    blurhash = info.blurhash
    dominant = await getDominantColor(buf, mime)
    if (!meta.altText) return NextResponse.json({ error: 'altText required for images' }, { status: 422 })
  }

  const { error: upErr } = await sb.storage.from('media').upload(key, buf, { contentType: mime, upsert: false })
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  const safety = await moderateMedia({ mime, size: file.size, userId, path: key })

  const { data: row, error: insErr } = await sb
    .from('media_assets')
    .insert({
      owner_id: userId,
      storage_path: key,
      media_type: mediaType,
      mime,
      width,
      height,
      alt_text: meta.altText ?? null,
      caption: meta.caption ?? null,
      ai_generated: meta.aiGenerated ?? null,
      ai_model: meta.aiModel ?? null,
      ai_prompt: meta.aiPrompt ?? null,
      blurhash,
      dominant_color: dominant,
      safety_labels: safety,
    })
    .select('*')
    .single()

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

  return NextResponse.json({ media: row }, { status: 201 })
}

