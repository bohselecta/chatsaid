// Usage:
// PH_HOST="https://app.posthog.com" PH_API_KEY="phx_xxx" PH_PROJECT_ID="1" PH_DASHBOARD_ID="1234" node scripts/export-posthog-dashboard.mjs
// Outputs ./posthog-dashboard.json

import fs from "node:fs"

const host = process.env.PH_HOST || "https://app.posthog.com"
const apiKey = process.env.PH_API_KEY
const projectId = process.env.PH_PROJECT_ID || "1"
const dashboardId = process.env.PH_DASHBOARD_ID

if (!apiKey || !dashboardId) {
  console.error("Missing PH_API_KEY or PH_DASHBOARD_ID")
  process.exit(1)
}

const H = async (path) => {
  const res = await fetch(`${host}/api${path}`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`)
  return res.json()
}

const dashboard = await H(`/projects/${projectId}/dashboards/${dashboardId}/?share_token=`)
const insights = await H(`/projects/${projectId}/insights/?dashboard=${dashboardId}&limit=200`)

// Strip noisy runtime fields
const clean = (obj) => JSON.parse(JSON.stringify(obj, (k, v) => {
  if (["id", "short_id", "created_at", "updated_at", "last_modified_at", "effective_date"].includes(k)) return undefined
  return v
}))

const output = {
  dashboard: clean(dashboard),
  insights: clean(insights.results || insights.results === 0 ? insights.results : insights)
}

fs.writeFileSync("./posthog-dashboard.json", JSON.stringify(output, null, 2))
console.log("Exported → posthog-dashboard.json")

