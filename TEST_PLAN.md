# Test Plan — ChatSaid Docked Assistant Bot

## Commands
- Unit: `pnpm test`
- Type: `pnpm typecheck`
- Lint: `pnpm lint`
- E2E: `pnpm e2e`

## API Unit / Integration (runner per repo config)
- health.spec.ts
  - returns ok with Redis connected
  - returns degraded with DB fallback
- pings.spec.ts
  - enforces 5/hour and 20/day
  - resets counters across windows
- digest.spec.ts
  - caches responses for 15 min
  - enqueues background job on cache miss
- cherries.spec.ts
  - create/list/update/discard flows
  - RLS enforcement for user isolation
- persona.spec.ts / watchlists.spec.ts
  - GET/PUT/POST happy paths + validation errors

## UI (React Testing Library)
- BotLauncher renders, toggles Assistant
- Assistant is focus‑trapped, ESC closes, motion completes
- DigestOverlay shows results on wake

## E2E (Playwright)
- Launch app, open Docked Assistant, run digest, view cherries, update persona, add watchlist.
- Save HTML report + trace.

