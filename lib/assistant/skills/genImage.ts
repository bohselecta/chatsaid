export async function genImage(prompt: string, provider: 'gemini' | 'huggingface' = 'gemini') {
  const res = await fetch('/api/gen/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, provider, n: 1 }),
  })
  if (!res.ok) throw new Error(`Image generation failed: ${res.status}`)
  return res.json() as Promise<{ media_ids: string[] }>
}

