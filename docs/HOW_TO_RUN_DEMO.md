# How to Run the Demo

1) Install & verify
```bash
pnpm i
pnpm verify:env
pnpm dev
```

2) Open http://localhost:3000 and check bottom‑right launcher.

3) Trigger a digest:

```bash
curl -X POST http://localhost:3000/api/agent/digest \
  -H 'Content-Type: application/json' \
  -d '{"windowStart":"2025-08-31T00:00:00Z","windowEnd":"2025-09-01T23:59:59Z"}'
```

4) Cherries flow

```bash
curl -X POST http://localhost:3000/api/agent/cherries -H 'Content-Type: application/json' -d '{}'
curl -X GET  http://localhost:3000/api/agent/cherries
```

5) Persona & Watchlists

```bash
curl -X PUT http://localhost:3000/api/persona/settings -H 'Content-Type: application/json' \
  -d '{"quietHours":"22:00-07:00","autonomy":"low"}'

curl -X POST http://localhost:3000/api/watchlists -H 'Content-Type: application/json' \
  -d '{"name":"starter","items":["ai","design"]}'
```

6) Health

```bash
curl -X GET http://localhost:3000/api/agent/health
```

