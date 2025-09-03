import { ImageGenProvider, GenRequest, GenImage } from '@/lib/gen/providers'

/**
 * Hugging Face Inference Providers (serverless) client.
 * Uses the standard Inference API endpoint with a model id.
 * Docs: https://huggingface.co/docs/api-inference/index
 */
export class HuggingFaceImageGen implements ImageGenProvider {
  constructor(
    private apiKey: string = process.env.HUGGINGFACE_API_KEY!,
    private modelId: string = process.env.HF_MODEL_ID || 'black-forest-labs/FLUX.1-dev',
  ) {}

  async generate(req: GenRequest): Promise<GenImage[]> {
    if (!this.apiKey) throw new Error('HUGGINGFACE_API_KEY missing')
    const n = Math.max(1, Math.min(4, (req as any).n ?? 1))
    const results: GenImage[] = []

    for (let i = 0; i < n; i++) {
      const response = await fetch(`https://api-inference.huggingface.co/models/${this.modelId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            Accept: 'image/png',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: req.prompt,
            parameters: {
              // Basic params; many models ignore unknown fields gracefully
              guidance_scale: 3,
              // seed: req.seed, // only some models support this
            },
            options: { wait_for_model: true },
          }),
        },
      )

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        throw new Error(`HF gen failed ${response.status} ${text}`)
      }

      const bytes = new Uint8Array(await response.arrayBuffer())
      results.push({ mime: 'image/png', bytes, model: this.modelId, prompt: req.prompt })
    }

    return results
  }
}

