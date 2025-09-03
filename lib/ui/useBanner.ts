"use client"
import { useState } from "react"

export function useBanner(){
  const [msg, set] = useState<string | null>(null)
  const [type, setType] = useState<"error"|"info">("info")
  const show = (m:string, t:"error"|"info"="info") => { set(m); setType(t) }
  const View = () => !msg ? null : (
    <div className={`fixed top-2 left-1/2 -translate-x-1/2 px-3 py-2 rounded-md text-sm shadow ${type==="error" ? "bg-red-600 text-white" : "bg-black text-white"}`}>
      {msg}
    </div>
  )
  return { show, View }
}

