export async function fetchOEmbed(url: string): Promise<{ html: string; meta: { width?: number; height?: number } }> {
  // Very small sanitizer/producer for popular providers; extend as needed.
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      const id = u.searchParams.get('v') || u.pathname.split('/').pop()
      const html = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${id}" title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
      return { html, meta: { width: 560, height: 315 } }
    }
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').pop()
      const html = `<iframe src="https://player.vimeo.com/video/${id}" width="640" height="360" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`
      return { html, meta: { width: 640, height: 360 } }
    }
  } catch {}
  // Fallback empty
  return { html: '', meta: {} }
}

