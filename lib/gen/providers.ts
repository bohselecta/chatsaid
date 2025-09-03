export type GenRequest = {
  prompt: string
  size?: '1024' | '1536'
  seed?: number
  safety?: 'strict' | 'balanced' | 'off'
  n?: number
}

export type GenImage = {
  mime: string
  bytes: Uint8Array
  model: string
  prompt: string
}

export interface ImageGenProvider {
  generate(req: GenRequest): Promise<GenImage[]>
}

