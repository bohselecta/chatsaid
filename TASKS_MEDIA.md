# Tasks — Media Support for Cherries

- [ ] DB migration: media_assets, cherry_media; create Supabase Storage bucket `media` (public read)
- [ ] API: POST /api/media/upload (image/video), POST /api/media/oembed (YouTube/Vimeo)
- [ ] Composer: drag-drop uploads, URL embed, preview gallery, reordering, alt/caption fields
- [ ] Display: MediaGallery (images, video, oEmbed) with blurhash placeholders and responsive layouts
- [ ] AI assist: buttons to suggest alt text/caption from image (optional first pass can be stubbed)
- [ ] Moderation: allowlist, size limit, basic labels; EXIF strip; rate limit
- [ ] Optional Mux: server action + `<mux-player>` fallback
- [ ] A11y: require alt (images), captions/titles (video), sanitized embeds, keyboard nav
- [ ] Perf: aspect-ratio boxes, lazy-loading

