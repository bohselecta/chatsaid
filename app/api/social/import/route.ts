import { NextRequest, NextResponse } from 'next/server'
import { importForAccounts } from '@/lib/social/importer'
import { guard } from '@/lib/server/featureGate'

export async function POST(req: NextRequest) {
  const blocked = guard('SOCIAL_INGEST')
  if (blocked) return blocked
  const body = await req.json().catch(() => ({}))
  const accountId = body?.accountId as string | undefined
  try {
    const results = await importForAccounts(accountId ? [accountId] : undefined, { autoConvert: true })
    return NextResponse.json({ ok: true, results })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'import_failed' }, { status: 500 })
  }
}
