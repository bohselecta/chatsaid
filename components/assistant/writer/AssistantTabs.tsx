"use client"
import { useState } from "react"
import { track } from "@/lib/analytics/events"

type Tab = "assist"|"outline"|"rewrite"|"title"

export default function AssistantTabs({
  onAction,
}:{
  onAction: (type: Tab, payload?: any)=>void
}){
  const [tab, setTab] = useState<Tab>("assist")
  return (
    <aside className="w-[320px] shrink-0 border-l border-white/10 bg-[#0b1220] text-white" role="region" aria-label="Writer assistant">
      <div className="flex gap-1 p-2">
        {( ["assist","outline","rewrite","title"] as Tab[] ).map(t=>(
          <button key={t}
            type="button"
            className={`rounded-md px-2 py-1 text-sm ${tab===t?"bg-white text-black":"bg-white/5 text-white hover:bg-white/10"}`}
            aria-pressed={tab===t}
            onClick={()=>setTab(t)}
          >
            {t[0].toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      <div className="p-3 space-y-2">
        {tab==="assist" && <p className="text-sm text-white/70">Ask for ideas, intros, or feedback as you write.</p>}

        {tab==="outline" && (
          <button className="w-full rounded-md bg-white text-black px-3 py-2 text-sm"
            onClick={()=>{ track("writer_assist_action",{ tab:"outline" }); onAction("outline") }}
          >Generate outline</button>
        )}

        {tab==="rewrite" && (
          <>
            <button className="w-full rounded-md bg-white text-black px-3 py-2 text-sm"
              onClick={()=>{ track("writer_assist_action",{ tab:"rewrite", tone:"concise" }); onAction("rewrite",{ tone:"concise" }) }}
            >Rewrite concise</button>
            <button className="w-full rounded-md bg-white text-black px-3 py-2 text-sm"
              onClick={()=>{ track("writer_assist_action",{ tab:"rewrite", tone:"friendly" }); onAction("rewrite",{ tone:"friendly" }) }}
            >Rewrite friendly</button>
          </>
        )}

        {tab==="title" && (
          <button className="w-full rounded-md bg-white text-black px-3 py-2 text-sm"
            onClick={()=>{ track("writer_assist_action",{ tab:"title" }); onAction("title") }}
          >Suggest titles</button>
        )}
      </div>
    </aside>
  )
}

