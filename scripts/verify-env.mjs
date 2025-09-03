#!/usr/bin/env node
/** Simple env verifier for ChatSaid */
const REQUIRED = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
];
const OPTIONAL = [
  'REDIS_URL','REDIS_HOST','REDIS_PORT','REDIS_PASSWORD','REDIS_DB',
  'WORKER_CONCURRENCY','WORKER_POLL_INTERVAL'
];

let ok = true;
for (const key of REQUIRED) {
  if (!process.env[key]) {
    console.error(`[MISSING] ${key}`);
    ok = false;
  } else {
    console.log(`[OK] ${key}`);
  }
}
for (const key of OPTIONAL) {
  if (process.env[key]) {
    console.log(`[SET] ${key}`);
  }
}
if (!ok) process.exit(1);

