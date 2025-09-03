import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const ORIGIN_TTL_MS = 5 * 60 * 1000
let cache: { at: number; list: string[] } = { at: 0, list: [] }

async function getAllowedOrigins(req: NextRequest): Promise<string[]> {
  const now = Date.now()
  if (now - cache.at < ORIGIN_TTL_MS && cache.list.length) return cache.list

  const base = process.env.NEXT_PUBLIC_BASE_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`
  try {
    const r = await fetch(`${base}/api/vibes/origins`, { cache: 'no-store' })
    if (r.ok) {
      const list = (await r.json()) as string[]
      cache = { at: now, list }
      return list
    }
  } catch {
    // ignore
  }
  return cache.list.length ? cache.list : ['https://vibes.diy', 'https://*.vibes.diy']
}

export async function middleware(req: NextRequest) {
  // Signed-in redirect from / -> /canopy (Supabase cookie heuristic)
  if (req.nextUrl.pathname === '/' && !req.nextUrl.searchParams.has('marketing') && req.cookies.get('sb-access-token')) {
    return NextResponse.redirect(new URL('/canopy', req.url))
  }

  const res = NextResponse.next()
  const origins = await getAllowedOrigins(req)
  const isDev = process.env.NODE_ENV !== 'production'
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self'"
  const styleSrc = "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com"
  const fontSrc = "font-src 'self' https://fonts.gstatic.com data:"
  const imgSrc = "img-src 'self' https: data: blob:"
  const mediaSrc = "media-src 'self' blob:"
  const connectSrc = isDev
    ? "connect-src 'self' https: ws: wss:"
    : "connect-src 'self' https:"
  const frameSrc = `frame-src 'self' https://vibes.diy https://*.vibes.diy ${origins.join(' ')}`
  const frameAncestors = "frame-ancestors 'self'"
  const baseUri = "base-uri 'self'"
  const formAction = "form-action 'self'"
  const objectSrc = "object-src 'none'"

  const csp = [
    "default-src 'self'",
    scriptSrc,
    styleSrc,
    fontSrc,
    imgSrc,
    mediaSrc,
    connectSrc,
    frameSrc,
    frameAncestors,
    baseUri,
    formAction,
    objectSrc,
  ].join('; ')
  res.headers.set('Content-Security-Policy', csp)
  return res
}

export const config = {
  matcher: [
    // Exclude Next.js internals and static assets
    '/((?!_next/|favicon.ico|.*\.(?:png|jpg|jpeg|webp|gif|svg|ico|txt|xml)).*)',
  ],
}
