"use client"
import Image from "next/image"

export default function AssistantBubble({ onOpen }: { onOpen?: () => void }) {
  return (
    <aside className="absolute right-6 bottom-6 rounded-xl bg-white/10 backdrop-blur text-white p-4 border border-white/15 max-w-xs">
      <div className="flex items-center gap-3">
        <Image src="/assets/assistant-avatar.png" alt="Assistant" width={64} height={64} className="rounded-full" priority />
        <div className="text-sm">
          <p className="opacity-90">Hi, I’m your assistant. Want help organizing your ideas?</p>
          <button
            className="mt-2 rounded-md bg-white text-black px-3 py-1.5 text-sm focus-ring"
            onClick={() => onOpen?.()}
          >
            Open Assistant
          </button>
        </div>
      </div>
    </aside>
  )
}
