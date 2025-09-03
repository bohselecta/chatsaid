# Task List — ChatSaid Docked Assistant Bot

## T‑01: Verify Environment & Config
- [ ] Add `lib/config.ts` that centralizes env access with safe defaults.
- [ ] Provide `scripts/verify-env.mjs` to validate required envs.
- [ ] Wire `pnpm verify:env` script in package.json.

## T‑02: Health Endpoint Parity
- [ ] Confirm `GET /api/agent/health` checks: cache connectivity, worker status, rate-limit store.
- [ ] When Redis not present, DB fallback must still return `status: "degraded"` not failure.
- [ ] Add unit tests for health probing functions.

## T‑03: Rate Limiting Counters (Ping Protocol)
- [ ] Implement cache‑backed counters (5/hour, 20/day) with fallback.
- [ ] Add zod validation for inputs.
- [ ] Add tests for edge cases (exceed hourly, exceed daily, reset window).

## T‑04: Digest Cache & Background Worker
- [ ] Ensure 15‑minute cache on digests using `lib/cacheService.ts`.
- [ ] Add worker job for digest generation and verify polling interval via env.
- [ ] Add tests to confirm cache hits/skips and worker enqueue behavior.

## T‑05: Cherry Flow API Hardening
- [ ] `POST /api/agent/cherries` generates a cherry; `GET` lists; `PUT` edits.
- [ ] Input validation with zod; ensure RLS policies are respected.
- [ ] Add tests for create/list/update/discard, with auth boundary tests.

## T‑06: Persona Settings + Watchlists
- [ ] `GET/PUT /api/persona/settings` mirrors UI controls; add integration test.
- [ ] `GET/POST /api/watchlists` create/list; add auth/RLS tests.

## T‑07: UI Polish — Docked Assistant
- [ ] `components/bot/*` motion timings, focus management, ESC to close, trap focus.
- [ ] A11y: role="dialog" for assistant; ARIA labels on launcher/buttons.
- [ ] Add `components/phase2/*` integration smoke tests with React Testing Library.

## T‑08: Demo Path Validation
- [ ] Implement Playwright e2e for DEMO_BOT_SYSTEM.md happy path.
- [ ] Record trace for CI artifact.

## T‑09: Developer UX
- [ ] `pnpm demo:api` script to curl key endpoints.
- [ ] Update README with quickstart and troubleshooting cross‑links.

## T‑10: CI Hooks (optional)
- [ ] Add GitHub Actions: typecheck, lint, unit, e2e (playwright) on PR.

