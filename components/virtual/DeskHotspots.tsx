import React from "react"

export type HotspotId = "book" | "cherry" | "coffee" | "avatar"

export type Hotspot = {
  id: HotspotId
  xPct: number
  yPct: number
  wPct: number
  hPct: number
  label: string
}

export const DEFAULT_HOTSPOTS: Hotspot[] = [
  { id: "book",   xPct: 62, yPct: 79, wPct: 14, hPct: 10, label: "Open Cherry Writer" },
  { id: "cherry", xPct: 44, yPct: 78, wPct: 10, hPct: 12, label: "Open Cherry Board" },
  { id: "coffee", xPct: 30, yPct: 80, wPct: 10, hPct: 12, label: "Open Coffee Barista" },
  { id: "avatar", xPct: 83, yPct: 76, wPct: 10, hPct: 12, label: "Open Personal Assistant" },
]

export function DeskHotspots({ onAction, hotspots = DEFAULT_HOTSPOTS }:{
  onAction: (id: HotspotId) => void
  hotspots?: Hotspot[]
}) {
  return (
    <div aria-label="Desk interactive items" className="pointer-events-none absolute inset-0">
      {hotspots.map(h => (
        <button
          key={h.id}
          aria-label={h.label}
          onClick={() => onAction(h.id)}
          className="absolute rounded-md focus:outline-none focus:ring-2 focus:ring-sky-400"
          style={{ left: `${h.xPct}%`, top: `${h.yPct}%`, width: `${h.wPct}%`, height: `${h.hPct}%` }}
        >
          <span className="sr-only">{h.label}</span>
        </button>
      ))}
      <style jsx>{`
        button { pointer-events: auto; }
      `}</style>
    </div>
  )
}

