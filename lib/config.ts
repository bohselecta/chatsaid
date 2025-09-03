// Centralized config access with safe defaults
export const CFG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  redisUrl: process.env.REDIS_URL,
  worker: {
    concurrency: Number(process.env.WORKER_CONCURRENCY ?? 3),
    pollMs: Number(process.env.WORKER_POLL_INTERVAL ?? 5000),
  },
};

export function assertRequired() {
  if (!CFG.supabaseUrl || !CFG.serviceRoleKey) {
    throw new Error('Missing required env for Supabase. Run pnpm verify:env');
  }
}

