import type { SocialAccount, SocialPost } from '../types'
import { fetchRss } from './rss'

// YouTube uses channel RSS: https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID
export async function fetchYouTube(account: SocialAccount): Promise<Pick<SocialPost,'platform_post_id'|'url'|'title'|'body'|'media'|'posted_at'|'ingest_meta'>[]> {
  // Reuse RSS parser; caller should provide proper RSS URL in config.handle or config.rss_url
  const rows = await fetchRss(account)
  // Tweak ingest_meta
  return rows.map(r => ({ ...r, ingest_meta: { ...(r.ingest_meta||{}), kind: 'youtube' } }))
}

