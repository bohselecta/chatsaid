import { NextResponse } from "next/server"

export async function POST(req: Request){
  const { body = "" } = await req.json().catch(()=>({}))
  const head = body.split(/\n|\.\s/)[0]?.slice(0, 60) || "An Untitled Thought"
  return NextResponse.json({ titles: [head, `${head} — A Quick Take`, `${head}: Notes`] })
}

