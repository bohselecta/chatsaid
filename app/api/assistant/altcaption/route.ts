import { NextRequest, NextResponse } from 'next/server'

// Minimal stub that improves alt/caption for a provided target identifier (id or URL)
// Matches AltCaptionResult expected by lib/assistant/skills/altCaption.ts
export async function POST(req: NextRequest) {
  try {
    const { target } = await req.json()
    if (!target || typeof target !== 'string') {
      return NextResponse.json({ error: 'target required' }, { status: 400 })
    }

    const base = target.slice(0, 80)
    const alt = `Descriptive alt for ${base}`
    const caption = `Generated caption related to ${base}`
    return NextResponse.json({ alt, caption })
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}

