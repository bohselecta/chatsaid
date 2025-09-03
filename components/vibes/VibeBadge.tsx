"use client";

import React from "react";

export default function VibeBadge({ source }: { source: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden></span>
      <span>Vibe App</span>
      <span className="text-white/60">• {source}</span>
    </span>
  );
}

