export type Platform = 'x' | 'youtube' | 'reddit' | 'rss' | 'email'

export type SocialAccount = {
  id: string
  user_id: string
  platform: Platform
  handle: string
  config: any
  status: 'active' | 'paused' | 'error'
  last_synced_at?: string | null
}

export type SocialPost = {
  id: string
  account_id: string
  platform_post_id?: string | null
  url?: string | null
  title?: string | null
  body?: string | null
  media: Array<{ url: string; type?: string; width?: number; height?: number }>
  posted_at?: string | null
  hash?: string | null
  ingest_meta?: any
  review_status: 'new' | 'ignored' | 'converted'
}

export type ImportRule = {
  id: string
  account_id: string
  persona_slug?: string | null
  branch?: string | null
  filters: { include?: string[]; exclude?: string[] }
  image_policy: 'none' | 'suggest' | 'auto-generate'
  auto_convert: boolean
}

export type DraftPayload = {
  title: string
  body: string
  tags: string[]
  media: Array<{
    url?: string
    id?: string
    alt?: string
    caption?: string
    mime?: string
    width?: number
    height?: number
  }>
  branch?: string | null
  vibe?: { appSlug?: string; appName?: string; props?: any } | null
  persona?: string | null
  provenance?: { platform?: Platform; url?: string | null; handle?: string }
}

