"use client"
import Image from "next/image"
import { track } from "@/lib/analytics/events"
import { useWriter } from "@/lib/ui/useWriter"

const base = "card card--hover border-black/10 bg-white/95 dark:bg-[#0b1220]/95 text-gray-900 dark:text-white p-4 focus-ring"

export function Tiles() {
  const open = useWriter.getState().openWriter
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <button
        className={base}
        aria-label="Create a post"
        onClick={() => { track("landing_tile_click", { tile: "create" }); open() }}
      >
        <div className="flex items-center gap-3">
          <Image src="/assets/tile-create.png" alt="" width={28} height={28} aria-hidden />
          <div>
            <div className="font-semibold">Create</div>
            <div className="text-sm opacity-80">Launch CherryWriter to share what’s on your mind.</div>
          </div>
        </div>
      </button>
      <a className={base} href="/explore" aria-label="Discover trending posts" onClick={() => track("landing_tile_click", { tile: "discover" })}>
        <div className="flex items-center gap-3">
          <Image src="/assets/tile-discover.png" alt="" width={28} height={28} aria-hidden />
          <div>
            <div className="font-semibold">Discover</div>
            <div className="text-sm opacity-80">See what’s trending and explore new voices.</div>
          </div>
        </div>
      </a>
      <a className={base} href="/home/me" aria-label="Organize your posts" onClick={() => track("landing_tile_click", { tile: "organize" })}>
        <div className="flex items-center gap-3">
          <Image src="/assets/tile-organize.png" alt="" width={28} height={28} aria-hidden />
          <div>
            <div className="font-semibold">Organize</div>
            <div className="text-sm opacity-80">Save your posts and ideas in one place.</div>
          </div>
        </div>
      </a>
    </div>
  )
}
