import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

/**
 * Reads the Authorization: Bearer <jwt> header (recommended) and validates it
 * against Supabase to retrieve the user. Falls back to sb-access-token cookie
 * if available. Returns the user id or throws if missing/invalid.
 */
export async function getUserId(): Promise<string> {
  const h = headers()
  const auth = h.get('authorization') || h.get('Authorization')
  let accessToken: string | null = null
  if (auth && auth.toLowerCase().startsWith('bearer ')) {
    accessToken = auth.slice(7).trim()
  } else {
    // Fallback: some clients might send Supabase access token cookie
    const cookieHeader = h.get('cookie') || ''
    const m = /sb-access-token=([^;]+)/.exec(cookieHeader)
    if (m) accessToken = decodeURIComponent(m[1])
  }

  if (!accessToken) throw new Error('Not authenticated')

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supa = createClient(url, anon)
  const { data, error } = await supa.auth.getUser(accessToken)
  if (error || !data?.user?.id) throw new Error('Not authenticated')
  return data.user.id
}

export async function assertAuthed(): Promise<void> {
  await getUserId()
}

/**
 * Simple admin guard using env ADMIN_USER_IDS (comma-separated user IDs).
 * Adjust to your org policy (roles table / JWT claims) as needed.
 */
export async function requireAdmin(): Promise<string> {
  const uid = await getUserId()

  // 1) Allowlist by user id
  const idList = (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (idList.includes(uid)) return uid

  // 2) Allowlist by email (JWT claim)
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supa = createClient(url, anon)
    // We cannot reuse getUser() here without the token; instead, check profiles table display_name
    // and optionally email if present in public profile.
    const names = (process.env.ADMIN_USER_NAMES || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const emails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)

    if (names.length || emails.length) {
      // Query profiles for display_name and (if stored) email
      const { data } = await supa.from('profiles').select('display_name, email').eq('id', uid).maybeSingle()
      const display = (data as any)?.display_name as string | undefined
      const email = ((data as any)?.email as string | undefined)?.toLowerCase()
      if ((display && names.includes(display)) || (email && emails.includes(email))) return uid
    }
  } catch {
    // fallthrough
  }

  throw new Error('forbidden')
}
