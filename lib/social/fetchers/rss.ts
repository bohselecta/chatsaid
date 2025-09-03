import { XMLParser } from 'fast-xml-parser'
import type { SocialAccount, SocialPost } from '../types'

export async function fetchRss(account: SocialAccount): Promise<Pick<SocialPost,'platform_post_id'|'url'|'title'|'body'|'media'|'posted_at'|'ingest_meta'>[]> {
  const url = account.config?.rss_url || account.handle
  if (!url) return []

  const res = await fetch(url, { headers: { 'Accept': 'application/rss+xml, application/atom+xml' } })
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`)
  const xml = await res.text()
  const parser = new XMLParser({ ignoreAttributes: false })
  const feed = parser.parse(xml)

  const items = feed?.rss?.channel?.item || feed?.feed?.entry || []
  const out = [] as Pick<SocialPost,'platform_post_id'|'url'|'title'|'body'|'media'|'posted_at'|'ingest_meta'>[]
  for (const it of items) {
    const link = it.link?.['@_href'] || it.link || it.guid || ''
    const title = it.title?.['#text'] || it.title || ''
    const body = it.description || it.content || it['content:encoded'] || ''
    const date = it.pubDate || it.published || it.updated || null
    const media = [] as any[]
    out.push({
      platform_post_id: String(it.guid || link || title || ''),
      url: typeof link === 'string' ? link : String(link || ''),
      title: typeof title === 'string' ? title : String(title || ''),
      body: typeof body === 'string' ? body : String(body || ''),
      media,
      posted_at: date ? new Date(date).toISOString() : null,
      ingest_meta: { kind: 'rss' },
    })
  }
  return out
}

