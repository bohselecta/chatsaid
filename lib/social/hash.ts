import crypto from 'crypto'

export function dedupHash(input: { platform?: string; handle?: string; title?: string | null; body?: string | null; url?: string | null; posted_at?: string | null }) {
  const parts = [
    (input.platform || '').toLowerCase(),
    (input.handle || '').toLowerCase(),
    (input.title || '').trim(),
    (input.body || '').trim(),
    (input.url || '').trim(),
    (input.posted_at || '').trim(),
  ].join('\n')
  return crypto.createHash('sha256').update(parts).digest('hex')
}

