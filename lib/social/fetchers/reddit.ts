import type { SocialAccount, SocialPost } from '../types'

// Supports Reddit JSON or RSS. If handle is u/<name>, we build RSS.
export async function fetchReddit(account: SocialAccount): Promise<Pick<SocialPost,'platform_post_id'|'url'|'title'|'body'|'media'|'posted_at'|'ingest_meta'>[]> {
  const handle: string = account.handle || ''
  let url = account.config?.rss_url
  if (!url) {
    if (/^u\//i.test(handle)) url = `https://www.reddit.com/${handle}/.rss`
    else if (/^r\//i.test(handle)) url = `https://www.reddit.com/${handle}/.rss`
    else if (/^https?:/i.test(handle)) url = handle
  }
  const a = { ...account, config: { ...(account.config||{}), rss_url: url } }
  const { fetchRss } = await import('./rss')
  const rows = await fetchRss(a)
  return rows.map(r => ({ ...r, ingest_meta: { ...(r.ingest_meta||{}), kind: 'reddit' } }))
}

