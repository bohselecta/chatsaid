import { NextResponse } from "next/server"

export async function POST(req: Request){
  const payload = await req.json().catch(()=>({}))
  const id = "post_"+Math.random().toString(36).slice(2)
  const url = `/post/${id}`
  return NextResponse.json({ id, url })
}

