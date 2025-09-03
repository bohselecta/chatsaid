# Tasks — Gemini Image Generation + Lean Media

- [ ] Add provider abstraction in `lib/gen/providers.ts`, implement `GeminiImageGen` in `lib/gen/gemini.ts` (server-side only)
- [ ] Add `POST /api/gen/image` with zod validation and daily rate-limit per user
- [ ] Transcode to WebP, strip EXIF, cap long edge (1536px) and bytes (≤2MB)
- [ ] Insert into `media_assets` with `ai_generated=true`, `ai_model`, and `ai_prompt`
- [ ] Compute and store blurhash + dominant color
- [ ] Update CherryComposer with a "Generate with AI" modal and quota meter
- [ ] Add AI attribution badge on cards/detail
- [ ] Add moderation pass on prompt + final image (align ToS)
- [ ] Optional: per-user BYO Gemini key routing

Env:

```
GEMINI_API_KEY=...
MAX_GEN_IMAGES_PER_DAY=50
MAX_IMAGE_LONG_EDGE=1536
MAX_IMAGE_BYTES=2000000
```

