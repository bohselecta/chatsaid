import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useDraft } from "@/lib/assistant/draft"

const STEPS = ["Idea", "Outline", "Draft", "Polish", "Media", "Publish"] as const
export type BaristaStep = typeof STEPS[number]

export function BaristaPanel({ onClose }:{ onClose: ()=>void }) {
  const [step, setStep] = useState<BaristaStep>("Idea")
  const [busy, setBusy] = useState(false)
  const [limitHint, setLimitHint] = useState<string | null>(null)
  const { state, actions } = useDraft()

  async function run(action: BaristaStep) {
    setBusy(true)
    setLimitHint(null)
    try {
      if (action === "Idea") {
        const r = await fetch("/api/assistant/idea", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ seed: state.body }) })
        if (r.status === 429) { const j = await r.json().catch(()=>({})); setLimitHint(j?.upgradeHint ? "Free limit reached — upgrade for more runs." : "Daily limit reached."); return }
        const j = await r.json(); actions.setBody(j.suggestions?.[0] ?? state.body)
      }
      if (action === "Outline") {
        const r = await fetch("/api/assistant/outline", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body: state.body }) })
        if (r.status === 429) { const j = await r.json().catch(()=>({})); setLimitHint(j?.upgradeHint ? "Free limit reached — upgrade for more runs." : "Daily limit reached."); return }
        const j = await r.json(); actions.setBody(j.outline ?? state.body)
      }
      if (action === "Draft") {
        const r = await fetch("/api/assistant/draft", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ outline: state.body, tone: (state as any).tone }) })
        if (r.status === 429) { const j = await r.json().catch(()=>({})); setLimitHint(j?.upgradeHint ? "Free limit reached — upgrade for more runs." : "Daily limit reached."); return }
        const j = await r.json(); actions.setBody(j.draft ?? state.body); if (j.title) actions.setTitle(j.title)
      }
      if (action === "Polish") {
        const r = await fetch("/api/assistant/polish", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body: state.body }) })
        if (r.status === 429) { const j = await r.json().catch(()=>({})); setLimitHint(j?.upgradeHint ? "Free limit reached — upgrade for more runs." : "Daily limit reached."); return }
        const j = await r.json(); actions.setBody(j.body ?? state.body); if (j.tags) actions.setTags(j.tags)
      }
        
      if (action === "Media") {
        const r = await fetch("/api/gen/image", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt: `illustration for: ${state.title || state.body?.slice(0,120)}`, n: 1 }) })
        if (r.status === 429) { const j = await r.json().catch(()=>({})); setLimitHint(j?.upgradeHint ? "Image limit reached — upgrade for more." : "Daily image limit reached."); return }
        const j = await r.json(); actions.addMedia((j.media||[]).map((m:any)=>({ id:m.id, mime:m.mime, url:m.publicUrl, width:m.width, height:m.height, alt:m.alt_text||"", caption:m.caption||"" })))
      }
      if (action === "Publish") {
        await actions.publish()
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="w-[360px] max-w-full space-y-3 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Coffee Barista</div>
        <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
      </div>

      {limitHint && (
        <div className="rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-xs text-amber-200">
          {limitHint}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {STEPS.map(s => (
          <Badge key={s} variant={s === step ? "default" : "secondary"} onClick={()=>setStep(s)} className="cursor-pointer">{s}</Badge>
        ))}
      </div>

      <Button disabled={busy} onClick={()=>run(step)} className="w-full">{busy ? "Working…" : `Run: ${step}`}</Button>
      <p className="text-xs text-white/60">Free tier: step-by-step only. Upgrade for conversational coaching.</p>
    </div>
  )
}
