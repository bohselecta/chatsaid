export type VibeProvider = 'remote-url' | 'npm-embed'

export type VibeApp = {
  id: string
  slug: string
  name: string
  description?: string
  provider: VibeProvider
  embed_url?: string
  npm_pkg?: string
  entry_name?: string
  allowed_origins?: string[]
  capabilities?: Record<string, unknown>
  status: 'draft' | 'active' | 'blocked'
}

