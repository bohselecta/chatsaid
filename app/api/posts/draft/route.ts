import { NextResponse } from "next/server"

export async function POST(req: Request){
  const payload = await req.json().catch(()=>({}))
  const savedAt = Date.now()
  return NextResponse.json({ id: payload?.id || "draft_"+Math.random().toString(36).slice(2), savedAt })
}

