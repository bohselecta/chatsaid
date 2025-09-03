/**
 * Redis Cache Service for ChatSaid Agent System
 * Provides caching for digests, watchlists, and ephemeral data
 */

import { createClient, RedisClientType } from 'redis';

interface CacheConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
}

class CacheService {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private fallbackToDB = true;

  constructor(private config: CacheConfig = {}) {}

  async connect(): Promise<void> {
    if (this.client && this.isConnected) return;
    try {
      // Try to connect to Redis if URL is provided
      if (this.config.url || (this.config.host && this.config.port)) {
        this.client = createClient({
          url: this.config.url || `redis://${this.config.host}:${this.config.port}`,
          password: this.config.password,
          database: this.config.db || 0,
        });

        this.client.on('error', (err) => {
          console.error('Redis Client Error:', err);
          this.isConnected = false;
        });

        this.client.on('connect', () => {
          console.log('Redis connected successfully');
          this.isConnected = true;
        });

        await this.client.connect();
      } else {
        console.log('Redis not configured, using database fallback');
        this.fallbackToDB = true;
      }
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.fallbackToDB = true;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  // Digest cache operations
  async getDigest(userId: string, timeSliceKey: string): Promise<any | null> {
    if (!this.isConnected || !this.client) {
      return null; // Fallback to database
    }

    try {
      const key = `digest:${userId}:${timeSliceKey}`;
      const cached = await this.client.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async setDigest(userId: string, timeSliceKey: string, digest: any, ttlSeconds = 900): Promise<void> {
    if (!this.isConnected || !this.client) {
      return; // Fallback to database
    }

    try {
      const key = `digest:${userId}:${timeSliceKey}`;
      await this.client.setEx(key, ttlSeconds, JSON.stringify(digest));
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  // Simple numeric counters (e.g., rate limits)
  async incrWithTTL(key: string, ttlSeconds: number): Promise<number | null> {
    if (!this.isConnected || !this.client) return null;
    try {
      const res = await this.client.incr(key);
      if (res === 1) {
        await this.client.expire(key, ttlSeconds);
      }
      return res;
    } catch (error) {
      console.error('Redis incr error:', error);
      return null;
    }
  }

  async getNumber(key: string): Promise<number | null> {
    if (!this.isConnected || !this.client) return null;
    try {
      const v = await this.client.get(key);
      if (v == null) return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    } catch (error) {
      console.error('Redis get number error:', error);
      return null;
    }
  }

  // Watchlist cache operations
  async getWatchlist(userId: string): Promise<any[] | null> {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const key = `watchlist:${userId}`;
      const cached = await this.client.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async setWatchlist(userId: string, watchlist: any[], ttlSeconds = 1800): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      const key = `watchlist:${userId}`;
      await this.client.setEx(key, ttlSeconds, JSON.stringify(watchlist));
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async invalidateWatchlist(userId: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      const key = `watchlist:${userId}`;
      await this.client.del(key);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  // Persona cache operations
  async getPersona(userId: string): Promise<any | null> {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const key = `persona:${userId}`;
      const cached = await this.client.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async setPersona(userId: string, persona: any, ttlSeconds = 3600): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      const key = `persona:${userId}`;
      await this.client.setEx(key, ttlSeconds, JSON.stringify(persona));
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async invalidatePersona(userId: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      const key = `persona:${userId}`;
      await this.client.del(key);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  // Rate limiting operations
  async checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    if (!this.isConnected || !this.client) {
      return { allowed: true, remaining: limit, resetTime: Date.now() + windowSeconds * 1000 };
    }

    try {
      const redisKey = `rate_limit:${key}`;
      const current = await this.client.incr(redisKey);
      
      if (current === 1) {
        await this.client.expire(redisKey, windowSeconds);
      }

      const ttl = await this.client.ttl(redisKey);
      const resetTime = Date.now() + ttl * 1000;

      return {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current),
        resetTime
      };
    } catch (error) {
      console.error('Redis rate limit error:', error);
      return { allowed: true, remaining: limit, resetTime: Date.now() + windowSeconds * 1000 };
    }
  }

  // Background job queue operations
  async enqueueJob(jobType: string, payload: any, priority = 0): Promise<string> {
    if (!this.isConnected || !this.client) {
      // Fallback to database queue
      return await this.enqueueJobInDB(jobType, payload, priority);
    }

    try {
      const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const job = {
        id: jobId,
        type: jobType,
        payload,
        priority,
        createdAt: new Date().toISOString(),
        attempts: 0,
        maxAttempts: 3
      };

      const queueKey = `queue:${jobType}`;
      await this.client.zAdd(queueKey, {
        score: priority,
        value: JSON.stringify(job)
      });

      return jobId;
    } catch (error) {
      console.error('Redis enqueue error:', error);
      return await this.enqueueJobInDB(jobType, payload, priority);
    }
  }

  async dequeueJob(jobType: string): Promise<any | null> {
    if (!this.isConnected || !this.client) {
      return await this.dequeueJobFromDB(jobType);
    }

    try {
      const queueKey = `queue:${jobType}`;
      const result = await this.client.zPopMax(queueKey);
      
      if (result && result.length > 0) {
        return JSON.parse(result[0].value);
      }
      
      return null;
    } catch (error) {
      console.error('Redis dequeue error:', error);
      return await this.dequeueJobFromDB(jobType);
    }
  }

  // Fallback database operations
  private async enqueueJobInDB(jobType: string, payload: any, priority: number): Promise<string> {
    // This would integrate with your database to store jobs
    // For now, return a mock job ID
    return `db_job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async dequeueJobFromDB(jobType: string): Promise<any | null> {
    // This would query your database for pending jobs
    // For now, return null
    return null;
  }

  // Cache statistics
  async getStats(): Promise<any> {
    if (!this.isConnected || !this.client) {
      return { connected: false, fallback: true };
    }

    try {
      const info = await this.client.info('memory');
      const keyspace = await this.client.info('keyspace');
      
      return {
        connected: true,
        fallback: false,
        memory: info,
        keyspace: keyspace
      };
    } catch (error) {
      console.error('Redis stats error:', error);
      return { connected: false, fallback: true, error: error.message };
    }
  }

  // Cherry cache operations
  async getCherries(userId: string, cacheKey: string): Promise<any[] | null> {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const key = `cherries:${userId}:${cacheKey}`;
      const cached = await this.client.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async setCherries(userId: string, cacheKey: string, cherries: any[], ttlSeconds = 900): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      const key = `cherries:${userId}:${cacheKey}`;
      await this.client.setEx(key, ttlSeconds, JSON.stringify(cherries));
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async invalidateCherries(userId: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      const pattern = `cherries:${userId}:*`;
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return this.fallbackToDB;
    }

    try {
      await this.client.ping();
      return true;
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
let cacheService: CacheService | null = null;

export function getCacheService(): CacheService {
  if (!cacheService) {
    const config: CacheConfig = {
      url: process.env.REDIS_URL,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : undefined,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : 0
    };

    cacheService = new CacheService(config);
  }
  return cacheService;
}

export default CacheService;
