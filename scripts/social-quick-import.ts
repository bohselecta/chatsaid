import { createClient } from '@supabase/supabase-js'
import { importForAccounts } from '../lib/social/importer'

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  let userId = process.env.TEST_USER_ID as string | undefined
  if (!url || !key) throw new Error('Missing Supabase env')
  const sb = createClient(url, key)
  if (!userId) {
    const { data: anyUser } = await sb.from('profiles').select('id').limit(1).maybeSingle()
    if (!anyUser?.id) throw new Error('Set TEST_USER_ID to a valid user uuid')
    userId = anyUser.id
  }

  // Seed an RSS account (Hacker News as example)
  const handle = process.env.TEST_RSS_URL || 'https://hnrss.org/frontpage'
  const { data: acc, error } = await sb.from('social_accounts').insert({ user_id: userId!, platform: 'rss', handle, config: { rss_url: handle } }).select('*').single()
  if (error) throw error
  console.log('[quick-import] Created account', acc.id)

  const res = await importForAccounts([acc.id])
  console.log('[quick-import] Import results', res)
}

main().catch((e) => { console.error(e); process.exit(1) })
