import { ImageGenProvider, GenRequest, GenImage } from './providers'

/**
 * Minimal Gemini image generation client placeholder.
 * Implement Google Generative Language API call when ready.
 * See: https://ai.google.dev/gemini-api/docs
 */
export class GeminiImageGen implements ImageGenProvider {
  constructor(private apiKey: string) {}

  async generate(_req: GenRequest): Promise<GenImage[]> {
    // Intentionally not implemented to avoid leaking API keys and because
    // actual payload/endpoint may change. Wire in your server-side fetch here.
    throw new Error('Gemini image generation not configured')
  }
}

