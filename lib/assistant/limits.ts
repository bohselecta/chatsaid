import { getCacheService } from '@/lib/cacheService'

type Counter = { date: string; count: number };
const mem: Map<string, Counter> = (globalThis as any).__rl_mem || new Map();
;(globalThis as any).__rl_mem = mem;

function endOfDaySeconds(): number {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return Math.max(1, Math.ceil((end.getTime() - now.getTime()) / 1000));
}

function dayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function takeDaily(
  uid: string,
  kind: string,
  limitPerDay: number
): Promise<{ ok: boolean; remaining: number; count: number }> {
  const cache = getCacheService();
  try {
    await cache.connect();
  } catch {}
  const key = `rl:${kind}:${uid}:${dayKey()}`;
  const ttl = endOfDaySeconds();

  // Try Redis counter first
  const c = await cache.incrWithTTL(key, ttl);
  if (typeof c === 'number') {
    const ok = c <= limitPerDay;
    return { ok, remaining: Math.max(0, limitPerDay - c), count: c };
  }

  // Fallback to in-memory (per server instance)
  const mk = `${kind}:${uid}`;
  const nowDay = dayKey();
  const cur = mem.get(mk);
  if (!cur || cur.date !== nowDay) mem.set(mk, { date: nowDay, count: 0 });
  const rec = mem.get(mk)!;
  rec.count += 1;
  const ok = rec.count <= limitPerDay;
  return { ok, remaining: Math.max(0, limitPerDay - rec.count), count: rec.count };
}

