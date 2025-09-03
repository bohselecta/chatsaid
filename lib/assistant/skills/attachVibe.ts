/**
 * Attach a Vibe app to a cherry.
 * Accepts either an app_id (uuid) or an app slug/name and resolves it via /api/vibes.
 */
export async function attachVibe(
  cherryId: string,
  { appId, appSlug, props = {} }: { appId?: string; appSlug?: string; props?: any }
) {
  let resolvedId = appId
  if (!resolvedId && appSlug) {
    const list = await fetch('/api/vibes').then((r) => r.json()).catch(() => ({ apps: [] as any[] }))
    const match = (list.apps || []).find((a: any) => a.slug === appSlug || a.name?.toLowerCase() === appSlug.toLowerCase())
    if (!match) throw new Error('Vibe app not found')
    resolvedId = match.id
  }
  if (!resolvedId) throw new Error('appId or appSlug is required')

  const res = await fetch(`/api/cherries/${cherryId}/vibe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: resolvedId, props }),
  })
  if (!res.ok) throw new Error('Attach vibe failed')
  return res.json()
}

