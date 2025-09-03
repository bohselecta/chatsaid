# chatsaid.com — MVP

Elegant, logical, and scalable social micro‑posting MVP.
Stack: **Next.js (App Router, TS) + Tailwind + Supabase (Auth + Postgres + RLS)**

## Features
- Email magic-link auth
- Public feed (chronological)
- Create post (text, 300 chars)
- Like posts
- Profiles: display name, bio, avatar
- Mobile-first layout

## Quick Start

1) **Create a Supabase project**
- Get `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Run the SQL in `supabase/schema.sql` in the Supabase SQL editor.

2) **Configure env**
Copy `.env.example` to `.env.local` and fill values.

3) **Install & run**
```bash
pnpm i
pnpm dev
```
Visit http://localhost:3000

## Deploy
- Recommended: Vercel (zero-config for Next.js).
- DNS: Point `app.chatsaid.com` → Vercel; leave `chatsaid.com` on Namecheap with a 301 redirect to the app, or host a marketing page there.
- Supabase scales independently.

## Future
- Pagination + infinite scroll
- Follows & personalized feed
- Rate-limiting & moderation
- Image upload via Supabase Storage

## Feature Flags and Guards (Open Core)

- Env flags:
  - `IS_CLOUD`: when `true`, all features are enabled. When `false`, feature-specific flags control access.
  - `ENABLE_SOCIAL_INGEST`, `ENABLE_DIGEST`, `ENABLE_RANKING`, `ENABLE_ANALYTICS`, `ENABLE_MODERATION`.
- Server guard:
  - Use `guard(feature)` from `lib/server/featureGate.ts` inside API routes.
  - Example:
    ```ts
    import { guard } from '@/lib/server/featureGate'
    export async function POST() {
      const blocked = guard('DIGEST')
      if (blocked) return blocked
      // ...handler
    }
    ```
- Disabled endpoints return 403 JSON:
  - `{ error: 'feature_unavailable', message: 'This feature is available on ChatSaid Cloud.', feature }`

## Social Ingest (Inbound v1)

1) Apply migration: `supabase/migrations/20250901194651_social_ingest.sql` in Supabase SQL editor (or `psql`).
2) Set flags: `ENABLE_SOCIAL_INGEST=true` (or `IS_CLOUD=true`).
3) Add a feed at `/settings/social` and check `/inbox`.
4) Assistant quick commands: "review imports", "convert latest 3".
