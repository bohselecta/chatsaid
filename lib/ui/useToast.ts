"use client"
import { useState } from "react"

export function useToast(){
  const [msg, set] = useState<string | null>(null)
  const toast = (m: string) => { set(m); setTimeout(() => set(null), 1600) }
  const View = () => msg ? (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-md bg-black text-white px-3 py-2 text-sm shadow-lg">{msg}</div>
  ) : null
  return { toast, View }
}

