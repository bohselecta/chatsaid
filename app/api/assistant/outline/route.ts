import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { takeDaily } from '@/lib/assistant/limits'
import { getUserTier } from '@/lib/assistant/tier'

export async function POST(req: NextRequest) {
  try {
    const uid = await getUserId().catch(() => 'anon');
    const tier = await getUserTier(uid);
    const { ok } = await takeDaily(uid, 'barista', tier.limits.baristaDaily);
    if (!ok) return NextResponse.json({ error: 'daily-limit', upgradeHint: true }, { status: 429 });

    const body = await req.json().catch(() => ({}));
    const text = String(body?.body || '').trim();
    const parts = text ? text.split(/\n+/).filter(Boolean) : ['Intro', 'Point 1', 'Point 2', 'Wrap'];
    const outline = parts.map((p, i) => `- ${i + 1}. ${p}`).join('\n');
    return NextResponse.json({ outline });
  } catch {
    return NextResponse.json({ error: 'bad-request' }, { status: 400 });
  }
}
