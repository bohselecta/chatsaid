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
    let text = String(body?.body || '').trim();
    if (text) {
      // Simple cleanups
      text = text.replace(/\s+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
    }
    const tags = Array.from(new Set((text.match(/#([a-z0-9\-]+)/gi) || []).map(t => t.slice(1).toLowerCase()))).slice(0, 6);
    return NextResponse.json({ body: text, tags });
  } catch {
    return NextResponse.json({ error: 'bad-request' }, { status: 400 });
  }
}
