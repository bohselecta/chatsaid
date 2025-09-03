import { createClient } from '@supabase/supabase-js'
import { dedupHash } from './hash'
import type { SocialAccount, SocialPost } from './types'
import { buildDraftFromSocialPost } from './convert'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const sb = createClient(url, key)

export async function importForAccounts(accountIds?: string[], opts?: { autoConvert?: boolean }) {
  let q = sb.from('social_accounts').select('*')
  if (accountIds && accountIds.length) q = q.in('id', accountIds)
  const { data: accounts, error } = await q
  if (error) throw error
  const list: SocialAccount[] = accounts || []
  const results: { accountId: string; inserted: number; skipped: number }[] = []
  for (const acc of list) {
    const { inserted, skipped } = await importOne(acc, !!opts?.autoConvert)
    results.push({ accountId: acc.id, inserted, skipped })
  }
  return results
}

async function importOne(account: SocialAccount, autoConvert: boolean) {
  if (account.status !== 'active') return { inserted: 0, skipped: 0 }
  // Load import rules for this account (if any)
  let rule: any = null
  try {
    const r = await sb.from('import_rules').select('*').eq('account_id', account.id).maybeSingle()
    if (!r.error) rule = r.data
  } catch {}
  let rows: any[] = []
  try {
    if (account.platform === 'rss' || account.platform === 'x') {
      const { fetchRss } = await import('./fetchers/rss')
      rows = await fetchRss(account)
    } else if (account.platform === 'youtube') {
      const { fetchYouTube } = await import('./fetchers/youtube')
      rows = await fetchYouTube(account)
    } else if (account.platform === 'reddit') {
      const { fetchReddit } = await import('./fetchers/reddit')
      rows = await fetchReddit(account)
    } else if (account.platform === 'email') {
      const { fetchEmail } = await import('./fetchers/email')
      rows = await fetchEmail(account)
    }
  } catch (e) {
    await sb.from('social_accounts').update({ status: 'error' }).eq('id', account.id)
    return { inserted: 0, skipped: 0 }
  }

  let inserted = 0, skipped = 0
  for (const r of rows) {
    const hash = dedupHash({ platform: account.platform, handle: account.handle, title: r.title, body: r.body, url: r.url, posted_at: r.posted_at })
    const exist = await sb.from('social_posts').select('id').eq('account_id', account.id).eq('hash', hash).limit(1).maybeSingle()
    if (exist.error) { /* ignore */ }
    if (exist.data) { skipped++; continue }
    const { data: created, error: insErr } = await sb.from('social_posts').insert({
      account_id: account.id,
      platform_post_id: r.platform_post_id,
      url: r.url,
      title: r.title,
      body: r.body,
      media: r.media || [],
      posted_at: r.posted_at,
      hash,
      ingest_meta: r.ingest_meta || {},
      review_status: 'new',
    }).select('id').single()
    if (insErr) { skipped++; continue }
    inserted++

    // Auto-convert to pre-built draft when enabled (API context only)
    if (autoConvert && rule?.auto_convert && created?.id) {
      try {
        const draft = await buildDraftFromSocialPost(created.id)
        await sb.from('social_posts').update({ ingest_meta: { ...(r.ingest_meta || {}), pre_draft: draft } }).eq('id', created.id)
      } catch {}
    }
  }

  await sb.from('social_accounts').update({ last_synced_at: new Date().toISOString() }).eq('id', account.id)
  return { inserted, skipped }
}
