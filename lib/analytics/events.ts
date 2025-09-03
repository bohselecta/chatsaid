export type EventName =
  | "writer_open"
  | "writer_save"
  | "writer_publish"
  | "writer_preview_toggle"
  | "writer_toolbar_click"      // NEW
  | "writer_category_change"    // NEW
  | "writer_assist_action"      // NEW
  | "writer_mode_change"        // (optional, split view)
  | "writer_template_insert"
  | "landing_tile_click"
  | "assistant_open"
  | "nav_click"
  | "canopy_search"
  | "canopy_search_live"
  | "canopy_filter_change"
  | "canopy_sort_change"
  | "card_action_click"
  | "card_action_impression"

export function track(name: EventName, props?: Record<string, any>) {
  if (typeof window === "undefined") return
  const anyWin = window as any

  // Real sinks
  try {
    if (anyWin.posthog?.capture) { anyWin.posthog.capture(name, props || {}); return }
    if (anyWin.gtag) { anyWin.gtag("event", name, props || {}); return }
  } catch {}

  // Dev fallback
  try {
    anyWin.__analytics = anyWin.__analytics || []
    anyWin.__analytics.push({ name, ...(props || {}) })
  } catch {}
}
