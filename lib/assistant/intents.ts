// Simple regex-based router for Docked Assistant

export type AssistantIntent =
  | { intent: 'GEN_IMAGE'; prompt: string }
  | { intent: 'SUMMARIZE_TO_CHERRY'; url: string }
  | { intent: 'ATTACH_VIBE'; app: string }
  | { intent: 'RUN_DIGEST'; scope: string }
  | { intent: 'ALT_CAPTION'; target: string }
  | { intent: 'REVIEW_IMPORTS' }
  | { intent: 'CONVERT_LATEST'; account?: string; count?: number }
  | { intent: 'UNKNOWN' }

export function routeIntent(input: string): AssistantIntent {
  const text = input.toLowerCase()

  if (/\b(generate|ai image|make\s+an?\s+image|create\s+image)\b/.test(text)) {
    return { intent: 'GEN_IMAGE', prompt: input }
  }

  if (/(summarize|make\s+.*cherry|turn\s+.*link)/.test(text)) {
    const urlMatch = input.match(/https?:[^\s]+/)
    return { intent: 'SUMMARIZE_TO_CHERRY', url: urlMatch?.[0] || '' }
  }

  if (/(add|attach).*vibe|(embed).*app/.test(text)) {
    const appMatch = input.match(/vibe\s+([\w\-@/]+)/i)
    return { intent: 'ATTACH_VIBE', app: appMatch?.[1] || '' }
  }

  if (/(digest|watchlist)/.test(text)) {
    return { intent: 'RUN_DIGEST', scope: input }
  }

  if (/(alt\s*text|caption)/.test(text)) {
    return { intent: 'ALT_CAPTION', target: input }
  }

  if (/(review imports|review inbox|social inbox)/.test(text)) {
    return { intent: 'REVIEW_IMPORTS' }
  }

  if (/(convert latest|convert\s+\d+\s+from)/.test(text)) {
    const m = input.match(/convert\s+(\d+)/i)
    return { intent: 'CONVERT_LATEST', account: input, count: m ? parseInt(m[1],10) : 3 }
  }

  return { intent: 'UNKNOWN' }
}
