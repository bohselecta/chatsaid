import { fetchRss } from '../lib/social/fetchers/rss'

describe('RSS fetcher', () => {
  const sample = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title>Sample Feed</title>
      <item>
        <title>Post One</title>
        <link>https://example.com/one</link>
        <guid>1</guid>
        <pubDate>Wed, 01 Jan 2025 00:00:00 GMT</pubDate>
        <description>Hello world</description>
      </item>
      <item>
        <title>Post Two</title>
        <link>https://example.com/two</link>
        <guid>2</guid>
        <pubDate>Thu, 02 Jan 2025 00:00:00 GMT</pubDate>
        <description>Another post</description>
      </item>
    </channel>
  </rss>`

  it('parses items from XML', async () => {
    // @ts-ignore
    global.fetch = jest.fn(async () => ({ ok: true, text: async () => sample }))
    const rows = await fetchRss({ id: 'a', user_id: 'u', platform: 'rss', handle: 'https://example.com/feed.xml', config: { rss_url: 'https://example.com/feed.xml' }, status: 'active' } as any)
    expect(rows.length).toBe(2)
    expect(rows[0].title).toContain('Post')
    expect(typeof rows[0].url).toBe('string')
  })
})
