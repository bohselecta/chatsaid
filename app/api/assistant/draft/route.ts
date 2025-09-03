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
    const outline = String(body?.outline || '').trim();
    const tone = String(body?.tone || '').trim();

    const title = (outline.split('\n')[0] || 'Untitled').replace(/^[-\d\.\s]+/, '').slice(0, 80);
    const draft = `${title}\n\n${outline}\n\n${tone ? `(tone: ${tone})` : ''}`.trim();
    return NextResponse.json({ title, draft });
  } catch {
    return NextResponse.json({ error: 'bad-request' }, { status: 400 });
  }
}
