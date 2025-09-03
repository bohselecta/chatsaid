import { NextResponse } from 'next/server'

export type Feature = 'SOCIAL_INGEST' | 'DIGEST' | 'RANKING' | 'ANALYTICS' | 'MODERATION'

export function isCloud() {
  return process.env.IS_CLOUD === 'true'
}

export function enabled(feature: Feature) {
  if (isCloud()) return true
  switch (feature) {
    case 'SOCIAL_INGEST': return process.env.ENABLE_SOCIAL_INGEST === 'true'
    case 'DIGEST': return process.env.ENABLE_DIGEST === 'true'
    case 'RANKING': return process.env.ENABLE_RANKING === 'true'
    case 'ANALYTICS': return process.env.ENABLE_ANALYTICS === 'true'
    case 'MODERATION': return process.env.ENABLE_MODERATION === 'true'
    default: return false
  }
}

export function guard(feature: Feature) {
  if (enabled(feature)) return null
  return NextResponse.json({
    error: 'feature_unavailable',
    message: 'This feature is available on ChatSaid Cloud.',
    feature
  }, { status: 403 })
}

