import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { takeDaily } from '@/lib/assistant/limits'
import { getUserTier } from '@/lib/assistant/tier'

export async function POST(req: NextRequest) {
  try {
    const uid = await getUserId().catch(() => 'anon');
    const tier = await getUserTier(uid);
    const { ok } = await takeDaily(uid, 'image', tier.limits.imageDaily);
    if (!ok) return NextResponse.json({ error: 'daily-limit', upgradeHint: true }, { status: 429 });

    const body = await req.json().catch(() => ({}));
    const prompt: string = String(body?.prompt || '').slice(0, 500);
    const n: number = Math.max(1, Math.min(4, Number(body?.n) || 1));
    const size: string = (body?.size === '1536' ? '1536' : '1024');

    // Stub generation: return placeholder media entries.
    const media = Array.from({ length: n }).map((_, i) => {
      const id = `local_${Date.now()}_${i}`;
      const publicUrl = size === '1536' ? '/virtual-home/bg-office.jpg' : '/virtual-home/bg-apartment.jpg';
      return {
        id,
        mime: 'image/jpeg',
        publicUrl,
        width: size === '1536' ? 1536 : 1024,
        height: size === '1536' ? 1536 : 1024,
        alt_text: prompt ? `AI image: ${prompt.slice(0, 80)}` : 'AI image',
        caption: '',
      };
    });

    const media_ids = media.map((m) => m.id);
    return NextResponse.json({ media_ids, media });
  } catch {
    return NextResponse.json({ error: 'bad-request' }, { status: 400 });
  }
}

