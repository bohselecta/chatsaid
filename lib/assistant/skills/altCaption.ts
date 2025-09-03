export type AltCaptionResult = { alt: string; caption?: string }

export async function altCaption(target: string) {
  const res = await fetch('/api/assistant/altcaption', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target }),
  })
  if (!res.ok) throw new Error('Alt/caption improve failed')
  return res.json() as Promise<AltCaptionResult>
}

