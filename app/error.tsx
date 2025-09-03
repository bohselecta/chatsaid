"use client"
import Link from "next/link"
import { useWriter } from "@/lib/ui/useWriter"
import { track } from "@/lib/analytics/events"

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="text-6xl font-bold text-black dark:text-white mb-4">🍒 500</h1>
      <p className="text-lg text-black/70 dark:text-white/70 mb-8">
        Something went wrong. Don’t worry — your ideas are safe.
      </p>
      <div className="flex gap-4">
        <Link
          href="/"
          className="rounded-lg border border-black/10 dark:border-white/20 px-4 py-2 focus-ring hover:bg-black/5 dark:hover:bg-white/10"
          aria-label="Back to Home"
          onClick={() => track("nav_click", { item: "home_500" })}
        >
          Back to Home
        </Link>
        <button
          type="button"
          className="rounded-lg bg-black text-white dark:bg:white dark:text-black px-4 py-2 focus-ring hover:opacity-90"
          aria-label="Open Writer"
          onClick={() => {
            track("writer_open", { source: "500" })
            useWriter.getState().openWriter({ title: "Draft recovery", body: "" })
          }}
        >
          Open Writer
        </button>
      </div>
      <div className="mt-6">
        <button
          type="button"
          className="rounded-md px-3 py-2 text-sm border border-black/10 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10 focus-ring"
          onClick={() => {
            try { reset() } catch {}
          }}
        >
          Try again
        </button>
      </div>
    </main>
  )
}

