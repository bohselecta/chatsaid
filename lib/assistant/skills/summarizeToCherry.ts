export type SummarizeResult = {
  title: string
  body: string
  tags: string[]
  imageAlt?: string
  caption?: string
}

// Placeholder: expects a server route /api/assistant/summarize to exist.
export async function summarizeToCherry(url: string) {
  const res = await fetch('/api/assistant/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  if (!res.ok) throw new Error('Summarization failed')
  return res.json() as Promise<SummarizeResult>
}

