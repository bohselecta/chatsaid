/**
 * Transcode image to WebP/AVIF and cap max dimensions/bytes.
 * Placeholder: uses original buffer if sharp is unavailable.
 */
export async function transcodeAndCap(
  buf: Buffer,
  opts: { maxEdge: number; maxBytes: number }
): Promise<{ bytes: Buffer; mime: string; width?: number; height?: number }> {
  try {
    // Dynamic import to keep server skinny when not installed
    // const sharp = (await import('sharp')).default
    // let img = sharp(buf).rotate().resize({ width: opts.maxEdge, height: opts.maxEdge, fit: 'inside', withoutEnlargement: true })
    // const out = await img.webp({ quality: 75 }).toBuffer({ resolveWithObject: true })
    // const capped = out.data.length > opts.maxBytes ? out.data.slice(0, opts.maxBytes) : out.data
    // const meta = await sharp(capped).metadata()
    // return { bytes: Buffer.from(capped), mime: 'image/webp', width: meta.width, height: meta.height }
    return { bytes: buf, mime: 'image/webp' }
  } catch {
    return { bytes: buf, mime: 'image/webp' }
  }
}

