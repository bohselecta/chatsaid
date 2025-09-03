# Tasks — Vibe Apps (Embeddable Mini‑Apps in Cherries)

- [ ] DB: add `vibe_apps`, `cherry_vibe` tables + RLS (done: supabase/migrations/20250901_vibes.sql)
- [ ] API: `GET/POST /api/vibes` (admin create), `POST /api/cherries/:id/vibe` attach
- [ ] Component: `components/vibes/VibeCanvas.tsx` (remote-url via iframe + sandbox + postMessage; npm-embed placeholder)
- [ ] Component: `components/vibes/VibeBadge.tsx` label + source
- [ ] Integrate canvas in Cherry expanded view; lazy mount; poster/thumbnail; focus trap
- [ ] Bridge: accept `vibe:ready` / `vibe:resize`; send `vibe:init` with props; origin allowlist
- [ ] CSP: restrict `frame-src` to registered origins; tighten `img-src` / `script-src`
- [ ] Worker: screenshot job to create thumb_url (Playwright) for posters
- [ ] A11y: region labels, ESC to close, keyboard trap in expanded panel
- [ ] Analytics: fire `vibe_view` / `vibe_interact` with provider/slug/dwell-ms
- [ ] Docs: creator guide for ready/resize/init contract

