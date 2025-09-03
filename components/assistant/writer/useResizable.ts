"use client"
import { useRef, useState, useEffect } from "react"

export function useResizable(initial=320, min=260, max=560){
  const [width, setWidth] = useState(initial)
  const dragging = useRef(false)

  useEffect(()=>{
    const move = (e: MouseEvent)=> dragging.current && setWidth(w=>Math.min(max, Math.max(min, w + e.movementX)))
    const up = ()=> { dragging.current = false }
    window.addEventListener("mousemove", move)
    window.addEventListener("mouseup", up)
    return ()=>{ window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up) }
  }, [min, max])

  const onDown = ()=> { dragging.current = true }
  return { width, onDown }
}

