"use client"
import { useMemo } from "react"
import { useWindowVirtualizer } from "@tanstack/react-virtual"
import InteractiveCherryCard from "@/components/phase2/InteractiveCherryCard"
import CherryGrid from "@/components/canopy/CherryGrid"

export default function VirtualFeed({ items, onReaction, onSaveToCategory, onLike }:{ items:any[]; onReaction:(id:string,key:string)=>void; onSaveToCategory:(id:string,cat:string)=>void; onLike:(id:string)=>void }){
  if (!Array.isArray(items) || items.length === 0) return null
  if (items.length < 40) return <CherryGrid items={items} onReaction={onReaction} onSaveToCategory={onSaveToCategory} onLike={onLike} />
  // Estimate columns responsively (simple heuristic)
  const cols = useMemo(()=>{
    if (typeof window === "undefined") return 3
    const w = window.innerWidth
    if (w >= 1280) return 4
    if (w >= 768) return 3
    if (w >= 640) return 2
    return 1
  }, [])

  const rows = Math.ceil((items?.length || 0) / cols)
  const virtualizer = useWindowVirtualizer({
    count: rows,
    estimateSize: () => 320, // average row height
    overscan: 6,
  })

  return (
    <section className="mx-auto max-w-6xl px-4 py-5">
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualizer.getVirtualItems().map(vRow => {
          const startIdx = vRow.index * cols
          const slice = (items || []).slice(startIdx, startIdx + cols)
          return (
            <div
              key={vRow.key}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 absolute left-0 right-0"
              style={{ transform: `translateY(${vRow.start}px)` }}
            >
              {slice.map((cherry:any) => (
                <div key={cherry.id} data-testid="cherry-card">
                  <InteractiveCherryCard
                    cherry={cherry}
                    onReaction={(id:string, key:string) => onReaction(id, key)}
                    onSaveToCategory={(id:string, cat:string) => onSaveToCategory(id, cat)}
                    onCategoryClick={() => {}}
                    userSavedCategories={[]}
                  />
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </section>
  )
}
