import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { takeDaily } from '@/lib/assistant/limits'
import { getUserTier } from '@/lib/assistant/tier'

export async function POST(req: NextRequest) {
  try {
    const uid = await getUserId().catch(() => 'anon');
    const tier = await getUserTier(uid);
    const { ok } = await takeDaily(uid, 'barista', tier.limits.baristaDaily);
    if (!ok) {
      return NextResponse.json({ error: 'daily-limit', upgradeHint: true }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const seed = String(body?.seed || '').trim();
    const suggestion = seed
      ? `Here are 3 angles on: ${seed}`
      : 'Try a punchy idea starter. Ex: “Why X beats Y for Z”.';

    return NextResponse.json({ suggestions: [suggestion] });
  } catch (e) {
    return NextResponse.json({ error: 'bad-request' }, { status: 400 });
  }
}
