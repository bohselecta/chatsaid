export async function getBlurhash(_buf: Buffer, _mime: string): Promise<{ width?: number; height?: number; blurhash?: string }> {
  // Placeholder: integrate sharp/canvas/blurhash in a follow-up.
  return { width: undefined, height: undefined, blurhash: undefined }
}

