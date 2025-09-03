export async function summarizeImported(opts: { persona?: string | null; branch?: string | null; text?: string }) {
  const url = 'https://example.com'
  const res = await fetch('/api/assistant/summarize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) })
  if (!res.ok) throw new Error('summarize_failed')
  const js = await res.json()
  return { title: js.title, body: js.body, tags: js.tags || [] }
}

