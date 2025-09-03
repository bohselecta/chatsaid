import VirtualHomeWithHotspots from '@/components/virtual/VirtualHomeWithHotspots'
import { getOrInitHome, updateHomeItems } from '@/lib/virtual/getOrInitHome'
import { getUserId } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

async function resolveUserIdFromParam(paramUsername: string, currentUserId: string): Promise<string | null> {
  if (!paramUsername || paramUsername === 'me') return currentUserId

  const sb = createServerSupabase()
  // Try exact match on profiles.username, then fallback to display_name
  const { data: byUsername } = await sb
    .from('profiles')
    .select('id, username, display_name')
    .eq('username', paramUsername)
    .maybeSingle()

  if (byUsername?.id) return byUsername.id as string

  const { data: byDisplay } = await sb
    .from('profiles')
    .select('id, display_name')
    .eq('display_name', paramUsername)
    .maybeSingle()

  return byDisplay?.id ?? null
}

export default async function Page({ params }: { params: { username: string } }) {
  let authedUserId: string | null = null
  try {
    authedUserId = await getUserId()
  } catch {
    // not authed
  }

  if (!authedUserId && (params.username === 'me' || !params.username)) {
    redirect('/login')
  }

  const viewerId = authedUserId
  const basisId = viewerId || ''
  const resolvedId = await resolveUserIdFromParam(params.username, basisId)
  const targetUserId = resolvedId || viewerId!
  const home = await getOrInitHome(targetUserId)

  async function onChange(nextItems: any) {
    'use server'
    // Only allow edits when viewing own home
    const viewerId = await getUserId().catch(() => null)
    if (!viewerId || viewerId !== targetUserId) return
    await updateHomeItems(targetUserId, nextItems)
  }

  const editable = !!authedUserId && authedUserId === targetUserId

  return (
    <div className="p-4 flex justify-center">
      <VirtualHomeWithHotspots
        backgroundUrl={home.background_url}
        deskUrl={home.desk_url}
        items={home.items}
        editable={editable}
        onChange={onChange}
      />
    </div>
  )
}
