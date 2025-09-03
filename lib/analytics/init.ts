import posthog from "posthog-js"

export function initAnalytics(){
  if (typeof window === "undefined") return
  if (!(process as any).env?.NEXT_PUBLIC_POSTHOG_KEY) return
  const anyWin = window as any
  if (anyWin.__PH_INIT) return
  posthog.init((process as any).env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: (process as any).env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
    capture_pageview: true,
    capture_pageleave: true,
  })
  anyWin.__PH_INIT = true
}

