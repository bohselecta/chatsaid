import { createClient } from '@supabase/supabase-js'
import type { DraftPayload, SocialPost } from './types'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const sb = createClient(url, key)

export async function buildDraftFromSocialPost(id: string): Promise<DraftPayload & { sourcePost: SocialPost | null }>{
  const { data: post, error } = await sb.from('social_posts').select('*, social_accounts:account_id(platform, handle), import_rules:account_id(*)').eq('id', id).maybeSingle()
  if (error || !post) throw new Error('not_found')
  const persona_slug = post?.import_rules?.persona_slug || null
  const branch = post?.import_rules?.branch || null
  const image_policy = post?.import_rules?.image_policy || 'suggest'

  const base: DraftPayload = {
    title: post.title || '',
    body: post.body || '',
    tags: [],
    media: (post.media || []).map((m: any) => ({ url: m.url, mime: m.type, width: m.width, height: m.height })),
    branch,
    persona: persona_slug,
    vibe: null,
    provenance: { platform: post.social_accounts?.platform, url: post.url, handle: post.social_accounts?.handle }
  }

  // Persona-tighten: call existing assistant summarize endpoint if present
  try {
    const prompt = {
      text: `${base.title}\n\n${base.body}`.trim(),
      persona: persona_slug,
      branch,
    }
    const res = await fetch('/api/assistant/summarize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: base.provenance?.url || 'https://example.com' }) })
    if (res.ok) {
      const js = await res.json()
      base.title = js.title || base.title
      base.body = js.body || base.body
      base.tags = js.tags || []
    }
  } catch {}

  if (image_policy === 'auto-generate') {
    try {
      const imagePrompt = `${base.title}`.slice(0,200)
      const res = await fetch('/api/gen/image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: imagePrompt, provider: 'gemini', n: 1 }) })
      if (res.ok) {
        const js = await res.json()
        const ids: string[] = js.media_ids || []
        if (ids.length) {
          base.media.push({ id: ids[0], alt: base.title, caption: '' })
        }
      }
    } catch {}
  }

  return { ...base, sourcePost: post as any }
}

