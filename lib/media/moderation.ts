type Input = { mime: string; size: number; userId: string; path: string }

export async function moderateMedia(input: Input): Promise<Record<string, any>> {
  // Minimal allowlist + size metadata. Extend with NSFW checks later.
  const allowed = input.mime.startsWith('image/') || input.mime.startsWith('video/')
  return { allowed, mime: input.mime, size: input.size }
}

