// Usage:
// PH_HOST="https://app.posthog.com" PH_API_KEY="phx_xxx" PH_PROJECT_ID="1" node scripts/seed-posthog-dashboard.mjs
// If self-hosted, set PH_HOST to your instance URL.

const host = process.env.PH_HOST || "https://app.posthog.com";
const apiKey = process.env.PH_API_KEY;              // Personal API key (Project > API keys)
const projectId = process.env.PH_PROJECT_ID || "1"; // Numeric project ID

if (!apiKey) {
  console.error("Missing PH_API_KEY"); process.exit(1);
}

const H = async (path, opts={}) => {
  const res = await fetch(`${host}/api${path}`, {
    ...opts,
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(opts.headers || {})
    }
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
  return res.json();
};

// Helper to create an insight (trends/funnel)
async function createInsight(payload) {
  return H(`/projects/${projectId}/insights/`, { method: "POST", body: JSON.stringify(payload) });
}

(async () => {
  // 1) Dashboard shell
  const dashboard = await H(`/projects/${projectId}/dashboards/`, {
    method: "POST",
    body: JSON.stringify({ name: "ChatSaid — Writer & Canopy", tags: ["chatsaid", "launch"], filters: {} })
  });

  // 2) Insights
  const insights = [];

  // Trends: writer_open daily
  insights.push(await createInsight({
    name: "Writer opens (daily)",
    dashboard: dashboard.id,
    filters: {
      insight: "TRENDS",
      display: "ActionsLineGraph",
      interval: "day",
      events: [{ id: "writer_open", name: "writer_open", type: "events", order: 0 }],
    }
  }));

  // Funnel: open -> save -> publish (7d)
  insights.push(await createInsight({
    name: "Writer funnel: open → save → publish (7d)",
    dashboard: dashboard.id,
    filters: {
      insight: "FUNNELS",
      date_from: "-7d",
      filter_test_accounts: true,
      exclusions: [],
      breakdown_type: null,
      events: [
        { id: "writer_open",    name: "writer_open",    type: "events", order: 0 },
        { id: "writer_save",    name: "writer_save",    type: "events", order: 1 },
        { id: "writer_publish", name: "writer_publish", type: "events", order: 2 },
      ],
    }
  }));

  // Trends: preview toggles (mode change)
  insights.push(await createInsight({
    name: "Preview toggles",
    dashboard: dashboard.id,
    filters: {
      insight: "TRENDS",
      display: "ActionsBar",
      interval: "day",
      events: [{ id: "writer_preview_toggle", name: "writer_preview_toggle", type: "events", order: 0 }],
    }
  }));

  // Trends: toolbar/category/assist interactions
  const interactionEvents = [
    "writer_toolbar_click",
    "writer_category_change",
    "writer_assist_action",
  ];
  insights.push(await createInsight({
    name: "Writer interactions (toolbar / category / assist)",
    dashboard: dashboard.id,
    filters: {
      insight: "TRENDS",
      display: "ActionsTable",
      events: interactionEvents.map((ev, i) => ({ id: ev, name: ev, type: "events", order: i })),
    }
  }));

  // Trends: canopy search & filters
  insights.push(await createInsight({
    name: "Canopy — search vs live vs filters",
    dashboard: dashboard.id,
    filters: {
      insight: "TRENDS",
      display: "ActionsLineGraph",
      interval: "day",
      events: [
        { id: "canopy_search",         name: "canopy_search",         type: "events", order: 0 },
        { id: "canopy_search_live",    name: "canopy_search_live",    type: "events", order: 1 },
        { id: "canopy_filter_change",  name: "canopy_filter_change",  type: "events", order: 2 },
        { id: "canopy_sort_change",    name: "canopy_sort_change",    type: "events", order: 3 },
      ],
    }
  }));

  // Trends: landing tile clicks
  insights.push(await createInsight({
    name: "Landing — tile clicks",
    dashboard: dashboard.id,
    filters: {
      insight: "TRENDS",
      display: "ActionsBar",
      interval: "day",
      events: [
        { id: "landing_tile_click", name: "landing_tile_click", type: "events", order: 0 },
        { id: "nav_click",          name: "nav_click",          type: "events", order: 1 },
      ],
    }
  }));

  console.log(`Dashboard created: ${host}/project/${projectId}/dashboards/${dashboard.id}`);
  console.log("Insights:", insights.map(i => `${i.name} → ${host}/project/${projectId}/insights/${i.id}`).join("\n"));
})().catch(e => { console.error(e); process.exit(1); });

