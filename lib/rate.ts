import { getCacheService } from '@/lib/cacheService'

export async function limit(userId: string, key: string, maxPerDay: number) {
  const cache = getCacheService()
  const windowSeconds = 24 * 60 * 60
  const res = await cache.checkRateLimit(`ua:${userId}:${key}`, maxPerDay, windowSeconds)
  return res
}

