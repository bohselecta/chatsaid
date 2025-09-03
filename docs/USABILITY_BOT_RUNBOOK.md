# Usability Bot Runbook

1) Start dev server (set BASE_URL if needed)

```
pnpm dev
# default baseURL is http://localhost:3000
```

2) Install Playwright deps (one-time)

```
pnpm ua:init
```

3) Crawl and generate report

```
pnpm ua:all
```

4) Open outputs
- `reports/usability.md`
- `reports/usability/` (screenshots)
- `reports/ia-graph.json`

5) Optional: Auto-scaffold missing routes (About/Help/etc.)

```
SCAFFOLD=1 pnpm ua:report
```

6) Work through `TASKS_USABILITY.md`
- Add missing routes (wire into header/footer/drawer)
- Fix top a11y issues
- Link orphans appropriately
- Verify route highlights and search across viewports

