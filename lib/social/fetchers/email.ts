import type { SocialAccount, SocialPost } from '../types'

// Email-in adapter is a placeholder; actual ingestion happens via webhook that writes to social_posts
export async function fetchEmail(_account: SocialAccount): Promise<Pick<SocialPost,'platform_post_id'|'url'|'title'|'body'|'media'|'posted_at'|'ingest_meta'>[]> {
  return []
}

