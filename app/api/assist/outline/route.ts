import { NextResponse } from "next/server"

export async function POST(req: Request){
  // Return canned outline for now
  return NextResponse.json({ bullets: ["Intro", "Key point 1", "Key point 2", "Conclusion"] })
}

