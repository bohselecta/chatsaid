import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : []
    if (!ids.length) return NextResponse.json({ media: [] })

    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data, error } = await sb
      .from('media_assets')
      .select('id, storage_path, media_type, mime, width, height, alt_text, caption, ai_model, ai_prompt')
      .in('id', ids)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const out = (data || []).map((row: any) => {
      const pub = sb.storage.from('media').getPublicUrl(row.storage_path)
      return { ...row, public_url: pub.data.publicUrl }
    })

    return NextResponse.json({ media: out })
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}

