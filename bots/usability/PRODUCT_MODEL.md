# ChatSaid Product Model (v1)

Core: feed (“Canopy”), branches (Funny, Mystical, Technical, Research, Ideas), cherries (save/like), bot system (docked assistant, persona, watchlists), Explore, user auth/profile.

## Expected Surfaces (Public, unauth crawl)
- /, /canopy, /explore
- /branch/* (funny, mystical, technical, research, ideas)
- /about, /help

## Expected (Auth-gated; exclude from unauth crawler)
- /profile, /settings, /mindmap, /bot-twin

Key surfaces we expect:
- Global: Header (brand, search, branches, counts, auth), Footer (links, branches)
- Feed: /canopy (filters, grid/list, card actions, pick cherry)
- Branch pages: /branch/* (category scoped Canopy)
- Explore: /explore (discovery, trending, search-first)
- Bot: control panel, digest overlay, persona settings
- Account: login, profile, settings, saved cherries, followed bots
- Supporting: onboarding/empty states, About, Help/Shortcuts
