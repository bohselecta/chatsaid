# ChatSaid Usability Report

## Summary
- Pages crawled: 11
- A11y violations (axe): 29
- Orphan routes (no internal links pointing to them): 0
- Missing key routes (from product model): 4

## Missing / Candidate Routes
- /profile
- /settings
- /mindmap
- /bot-twin

## Orphan Routes
- none

## Top A11y Offenders (by violations)
- /about: 5
- /help: 5
- /login: 3
- /: 2
- /canopy: 2
- /explore: 2
- /branch/funny: 2
- /branch/mystical: 2
- /branch/technical: 2
- /branch/research: 2

## Navigation Notes
- Ensure all branch pages are reachable from header, footer, and mobile drawer.
- Add current-route highlight to header rail and drawer (if missing).
- Provide a visible persistent search in global header (md+) and inside drawer (sm).

## Recommended Tickets
- feat(nav): add route & link for /profile
- feat(nav): add route & link for /settings
- feat(nav): add route & link for /mindmap
- feat(nav): add route & link for /bot-twin

