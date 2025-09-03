"use client"
import { useEffect } from "react"
import { useSearchParams } from "next/navigation"

export default function BoomPage(){
  const params = useSearchParams()
  const shouldBoom = params.get("500") === "1"
  useEffect(() => {
    if (shouldBoom) {
      // Throw on mount to exercise the global error boundary
      throw new Error("Dev-triggered 500: /boom?500=1")
    }
  }, [shouldBoom])

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-3">Boom Playground</h1>
      <p className="text-white/70 mb-4">Append <code>?500=1</code> to this URL to trigger the global error page.</p>
      <a
        className="inline-block rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm focus-ring hover:bg-white/10"
        href="/boom?500=1"
      >
        Trigger 500 now
      </a>
    </main>
  )
}

