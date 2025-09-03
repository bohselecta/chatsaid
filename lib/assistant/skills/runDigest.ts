export async function runDigest(scope: string) {
  const res = await fetch('/api/agent/digest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scope }),
  })
  if (!res.ok) throw new Error('Digest failed')
  return res.json()
}

