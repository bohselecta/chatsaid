import { createClient } from '@supabase/supabase-js'

export type UserTier = {
  isPro: boolean;
  limits: {
    baristaDaily: number;
    imageDaily: number;
  };
};

/**
 * Placeholder tier lookup. Marks users as Pro via env PRO_USER_IDS or profiles.plan === 'pro' when available.
 */
export async function getUserTier(userId: string): Promise<UserTier> {
  // 1) Env override for quick testing
  const proIds = (process.env.PRO_USER_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (proIds.includes(userId)) {
    return { isPro: true, limits: { baristaDaily: 200, imageDaily: 30 } };
  }

  // 2) Optional: check profiles.plan column if exists
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const sb = createClient(url, key);
    const { data } = await sb.from('profiles').select('plan').eq('id', userId).maybeSingle();
    if ((data as any)?.plan === 'pro') {
      return { isPro: true, limits: { baristaDaily: 200, imageDaily: 30 } };
    }
  } catch {}

  // Default: free
  return { isPro: false, limits: { baristaDaily: 30, imageDaily: 3 } };
}

