"use client"
import clsx from "clsx"
import { track } from "@/lib/analytics/events"

const CATS = ["funny","weird","technical","research","ideas"] as const
export type WriterCat = typeof CATS[number]

export default function WriterToolbar({
  activeCats, onToggleCat, onFmt,
}: {
  activeCats: WriterCat[]
  onToggleCat: (c: WriterCat) => void
  onFmt: (cmd: "bold"|"italic"|"link"|"code"|"ul"|"ol"|"quote") => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-[#0b1220] px-4 py-2">
      <div className="flex items-center gap-1" role="group" aria-label="Formatting">
        {[
          ["bold","B"],["italic","I"],["link","↗"],["code","</>"],["ul","•"],["ol","1."],["quote","“”"],
        ].map(([cmd,label])=>(
          <button key={cmd}
            type="button"
            className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white focus-ring"
            onClick={()=>{ track("writer_toolbar_click",{action:cmd}); onFmt(cmd as any)}}
            aria-label={`Format ${label}`}
          >{label}</button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-1" role="group" aria-label="Categories">
        {CATS.map(c=>{
          const active = activeCats.includes(c)
          return (
            <button key={c}
              type="button"
              className={clsx("rounded-full px-3 py-1 text-sm border focus-ring",
                active ? "bg-white text-black border-white/0" : "bg-white/5 text-white border-white/10 hover:bg-white/10")}
              aria-pressed={active}
              onClick={()=>{ track("writer_category_change",{cat:c, state: active ? "off" : "on"}); onToggleCat(c)}}
            >
              {c[0].toUpperCase()+c.slice(1)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
