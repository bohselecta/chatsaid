import { dedupHash } from '../lib/social/hash'

describe('dedupHash', () => {
  it('produces stable sha256 for same input', () => {
    const a = dedupHash({ platform: 'rss', handle: '@me', title: 't', body: 'b', url: 'u', posted_at: '2025-01-01' })
    const b = dedupHash({ platform: 'rss', handle: '@me', title: 't', body: 'b', url: 'u', posted_at: '2025-01-01' })
    expect(a).toEqual(b)
    expect(a).toMatch(/^[a-f0-9]{64}$/)
  })
})

