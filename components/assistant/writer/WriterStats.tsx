"use client"

export default function WriterStats({ body }:{ body: string }) {
  const words = body.trim().split(/\s+/).filter(Boolean).length
  const chars = body.length
  const readMin = Math.max(1, Math.round(words / 225))
  return (
    <div className="flex items-center gap-3 px-4 py-2 text-xs text-white/70 border-t border-white/10" aria-live="polite">
      <span>{words} words</span>
      <span>•</span>
      <span>{chars} characters</span>
      <span>•</span>
      <span>~{readMin} min read</span>
    </div>
  )
}

