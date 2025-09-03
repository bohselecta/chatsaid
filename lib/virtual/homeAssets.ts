export type VHResponsive = {
  id: string
  srcset: string
  sizes: string
  fallback: string
  blur: string
  alt: string
}

// Note: Using SVG placeholders in /public now. When you add JPG/PNG assets
// and run `pnpm vh:previews`, update fallback paths and blur data below.
// For now, these responsive entries are prepared and can be enabled when assets exist.
export const VH_BACKGROUNDS: VHResponsive[] = [
  {
    id: 'apartment',
    srcset: [
      '/virtual-home/bg-apartment-400w.webp 400w',
      '/virtual-home/bg-apartment-800w.webp 800w',
      '/virtual-home/bg-apartment-1600w.webp 1600w',
    ].join(', '),
    sizes: '(max-width: 550px) 100vw, 550px',
    fallback: '/virtual-home/bg-apartment.jpg',
    blur: 'data:image/webp;base64,UklGRkoAAABXRUJQVlA4ID4AAAAQAwCdASoYABIAPu1mq08ppaOiKA1RMB2JaWvbABsLNgAA/u8J8IBm9ikghvgupnMtyCPUOuTfD7zhDAlAAA==',
    alt: 'Cozy apartment background',
  },
  {
    id: 'office',
    srcset: [
      '/virtual-home/bg-office-400w.webp 400w',
      '/virtual-home/bg-office-800w.webp 800w',
      '/virtual-home/bg-office-1600w.webp 1600w',
    ].join(', '),
    sizes: '(max-width: 550px) 100vw, 550px',
    fallback: '/virtual-home/bg-office.jpg',
    blur: 'data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAACwAwCdASoYABIAPu1ipk4ppbwiMBgMA4AdiWcAygAVRJYPpr5cQAD+7rdIN5io5EofloM++s9TF30HECE0ZpR6k12t3yfAuKXgAA==',
    alt: 'Modern office with large windows',
  },
  {
    id: 'skyline',
    srcset: [
      '/virtual-home/bg-skyline-400w.webp 400w',
      '/virtual-home/bg-skyline-800w.webp 800w',
      '/virtual-home/bg-skyline-1600w.webp 1600w',
    ].join(', '),
    sizes: '(max-width: 550px) 100vw, 550px',
    fallback: '/virtual-home/bg-skyline.jpg',
    blur: 'data:image/webp;base64,UklGRmQAAABXRUJQVlA4IFgAAAAQBACdASoYABIAPu1mpk2ppbQiMBgMAoAdiWcAwzQY7DJ0XtsvE77GkAD+7wbfzDVETZ6dNbHQw3//R2mxFLmmeeFIlSrYE4UNmx4O0TQaeK/DT5ZjCAAA',
    alt: 'City skyline at dusk',
  },
]

export const VH_DESKS: VHResponsive[] = [
  {
    id: 'wood',
    srcset: [
      '/virtual-home/desk-wood-400w.webp 400w',
      '/virtual-home/desk-wood-800w.webp 800w',
      '/virtual-home/desk-wood-1600w.webp 1600w',
    ].join(', '),
    sizes: '(max-width: 550px) 100vw, 550px',
    fallback: '/virtual-home/desk-wood.png',
    blur: 'data:image/webp;base64,UklGRoYAAABXRUJQVlA4WAoAAAAQAAAAFwAABQAAQUxQSCYAAAABN0AkQBqE5gUvGo2IYNYHBiFJSaVUSiGF96dYhoj+Z3FP4TPsEVZQOCA6AAAAEAMAnQEqGAAGAD7tYqlNrSWjojAIAaAdiUAXYAWg8tYAAP7mSONje9LLMltlopZ4E4tjM8yPvwAAAA==',
    alt: 'Wooden desk surface',
  },
  {
    id: 'steel',
    srcset: [
      '/virtual-home/desk-steel-400w.webp 400w',
      '/virtual-home/desk-steel-800w.webp 800w',
      '/virtual-home/desk-steel-1600w.webp 1600w',
    ].join(', '),
    sizes: '(max-width: 550px) 100vw, 550px',
    fallback: '/virtual-home/desk-steel.png',
    blur: 'data:image/webp;base64,UklGRoQAAABXRUJQVlA4WAoAAAAQAAAAFwAABQAAQUxQSCgAAAABN6AQAAKkeMLI3+g0IiLwmCIMQpKSwiukUirlT7EMEf3P4qzCZngvVlA4IDYAAACwAwCdASoYAAYAPu1kqU2tJaOiMAgBoB2JZwCdMoAEaEOmwEhoAAD+6/gGzxk1HE5zQI0YAAA=',
    alt: 'Steel desk surface',
  },
]

export const VH_START_ITEMS = [
  { id: 'cherry-1', src: '/virtual-home/item-cherry.svg', alt: 'Cherry',  xPct: 45, yPct: 72, widthPct: 10 },
  { id: 'vibe-1',   src: '/virtual-home/item-vibe.svg',   alt: 'Vibe app', xPct: 62, yPct: 74, widthPct: 12 },
]

export type VHItem = typeof VH_START_ITEMS[number]
