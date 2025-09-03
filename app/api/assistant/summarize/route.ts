import { NextRequest, NextResponse } from 'next/server'

// Minimal stub that returns a plausible cherry summary from a URL
// Matches SummarizeResult expected by lib/assistant/skills/summarizeToCherry.ts
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'url required' }, { status: 400 })
    }

    // Very lightweight summarization stub
    const u = safeParseUrl(url)
    const host = u?.host?.replace(/^www\./, '') || 'source'
    const path = u?.pathname?.replace(/\/$/, '') || '/'

    const title = `Quick take: ${host}`
    const body = `A concise summary of ${host}${path === '/' ? '' : path}. Highlights key ideas and takeaways for faster review.`
    const tags = inferTagsFromHost(host)

    return NextResponse.json({ title, body, tags })
  } catch (e) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}

function safeParseUrl(s: string) {
  try { return new URL(s) } catch { return null as any }
}

function inferTagsFromHost(host: string): string[] {
  const t: string[] = []
  if (host.includes('arxiv')) t.push('research')
  if (host.includes('huggingface')) t.push('ml')
  if (host.includes('medium')) t.push('essay')
  if (host.includes('x.com') || host.includes('twitter')) t.push('thread')
  if (t.length === 0) t.push('link')
  return t
}

