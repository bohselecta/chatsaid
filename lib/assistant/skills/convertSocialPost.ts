export async function convertSocialPost(id: string) {
  const res = await fetch(`/api/social/posts/${id}/convert`, { method: 'POST' })
  if (!res.ok) throw new Error('convert_failed')
  return res.json() as Promise<{ draft: any }>
}

