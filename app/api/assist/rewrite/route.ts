import { NextResponse } from "next/server"

export async function POST(req: Request){
  const { body = "", tone = "concise" } = await req.json().catch(()=>({}))
  const rewritten = tone === "friendly"
    ? body.replace(/\b(I)\b/g, 'We')
    : body.replace(/\s{2,}/g, ' ').trim()
  return NextResponse.json({ body: rewritten })
}

