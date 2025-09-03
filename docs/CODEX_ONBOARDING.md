# Codex Onboarding — ChatSaid Docked Assistant Bot

Read order:
1. docs/HANDOFF_BOT_SYSTEM.md — the authoritative handoff doc.
2. docs/AGENTS.md — Agent Layer overview & message spec.
3. docs/README_AGENT_SYSTEM.md — Running services and integration notes.
4. docs/DEMO_BOT_SYSTEM.md — End‑to‑end demo steps.

Core responsibilities:
- Ensure UI: BotLauncher ↔ BotAssistant panel works with smooth motion.
- Ensure APIs:
  - /api/agent/digest (POST)
  - /api/agent/ping (POST/GET/PUT)
  - /api/agent/cherries (GET/POST/PUT)
  - /api/watchlists (GET/POST)
  - /api/persona/settings (GET/PUT)
  - /api/agent/health (GET)
- Ensure background worker + cache layer operate (Redis preferred, DB fallback ok).

Deliverables for this iteration:
- Complete the tasks in TASKS_CHATSAID_BOT.md.
- Validate with TEST_PLAN.md.
- If issues: add to PATCH_NOTES.md with root cause + fix.

Runbook (dev):
```bash
pnpm i
pnpm typecheck
pnpm dev
# ensure .env.local is set (see verify script)
```

