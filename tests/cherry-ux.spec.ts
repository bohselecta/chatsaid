import { test, expect } from '@playwright/test'

// Rough contrast ratio helper (sRGB)
function contrastRatio(fg: string, bg: string) {
  const toRGB = (c: string) => {
    const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
    if (!m) return [0, 0, 0]
    return [Number(m[1]), Number(m[2]), Number(m[3])].map(v => v / 255)
  }
  const luminance = (rgb: number[]) => {
    const f = (x: number) => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4))
    const [r, g, b] = rgb.map(f)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const L1 = luminance(toRGB(fg))
  const L2 = luminance(toRGB(bg))
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)
}

test.describe('ChatSaid UX – Chromium quick pass', () => {
  test('1) Canopy loads + card visible', async ({ page }) => {
    await page.goto('/canopy')
    await expect(page.getByRole('heading', { name: /Canopy/i })).toBeVisible()

    // Expect at least one card with "Pick Cherry" button
    const pickBtn = page.getByRole('button', { name: /Pick Cherry/i }).first()
    await expect(pickBtn).toBeVisible()

    // Performance smoke (DOMContentLoaded delta)
    const dcl = await page.evaluate(() => {
      const t: any = performance.timing
      return t.domContentLoadedEventEnd - t.navigationStart
    })
    test.info().annotations.push({ type: 'metric', description: `DCL: ${dcl}ms` })
    expect(dcl).toBeLessThan(2500)
  })

  test('2) Cherry Card: pick via mouse', async ({ page }) => {
    await page.goto('/canopy')

    const pick = page.getByRole('button', { name: /Pick Cherry/i }).first()
    await pick.click()

    // Category tray: five menuitems appear (Funny, Weird, Technical, Research, Ideas)
    const ideas = page.getByRole('menuitem', { name: /Ideas/i })
    await expect(ideas).toBeVisible()

    await ideas.click()

    // Assert a non-GET POST to /api/reactions succeeds (onPick handler)
    const result = await page.waitForResponse(res =>
      res.url().includes('/api/reactions') && res.request().method() !== 'GET'
    )
    expect(result.ok()).toBeTruthy()
  })

  test('3) Cherry Card: keyboard basics', async ({ page }) => {
    await page.goto('/canopy')

    const pick = page.getByRole('button', { name: /Pick Cherry/i }).first()
    await pick.focus()
    await expect(pick).toBeFocused()
    await page.keyboard.press('Enter')

    const ideas = page.getByRole('menuitem', { name: /Ideas/i })
    await expect(ideas).toBeVisible()

    // Move focus to a menu item and select via keyboard
    await ideas.focus()
    await expect(ideas).toBeFocused()
    await page.keyboard.press('Enter')

    // ESC should close if still open; otherwise just ensure menuitem is gone
    await page.keyboard.press('Escape')
    await expect(ideas).toBeHidden({ timeout: 2000 })
  })

  test('4) Writer modal flow (Home → Writer)', async ({ page }) => {
    // Navigate to My Room variant
    await page.goto('/home/me')

    // Open via desk hotspot (book)
    const openWriter = page.getByRole('button', { name: /Open Cherry Writer/i })
    await expect(openWriter).toBeVisible()
    await openWriter.click()

    const dialog = page.getByRole('dialog', { name: /Cherry Writer/i })
    await expect(dialog).toBeVisible()

    await dialog.getByLabel('Title').fill('Test Cherry Title')
    await dialog.getByLabel('Body').fill('**Bold** _italic_ sample body.')

    // Pick category (Ideas)
    await dialog.getByRole('button', { name: /Category Ideas/i }).click()

    // Save via Cmd/Ctrl+S
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+S' : 'Control+S')
    await expect(dialog.getByText(/Saved|Saving/i)).toBeVisible()

    // Preview toggle
    await dialog.getByRole('button', { name: /Preview/i }).click()
    // A simple semantic element should render in preview
    await expect(dialog.locator('h1,h2,h3,strong,em,code').first()).toBeVisible()

    // Esc closes
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()

    // Ensure background scroll is enabled
    const overflow = await page.evaluate(() => getComputedStyle(document.body).overflow)
    expect(overflow).not.toBe('hidden')
  })

  test('5) Aesthetic sanity + snapshot', async ({ page }) => {
    await page.goto('/canopy')

    // Grab first card via its title container proximity
    const card = page.locator('button:has-text("Pick Cherry")').first().locator('..').locator('..').locator('..')

    // Rhythm: title margin ≥ 12px
    const title = page.locator('h3').first()
    await expect(title).toBeVisible()
    const titleMarginBottom = await title.evaluate(el => parseFloat(getComputedStyle(el).marginBottom || '0'))
    expect(titleMarginBottom).toBeGreaterThanOrEqual(12)

    // Excerpt line-height roughly 20–32px on desktop
    const excerpt = page.locator('p').first()
    await expect(excerpt).toBeVisible()
    const lh = await excerpt.evaluate(el => parseFloat(getComputedStyle(el).lineHeight || '0'))
    expect(lh).toBeGreaterThan(20)
    expect(lh).toBeLessThan(32)

    // Contrast guardrail: paragraph text vs nearest card background
    const [fg, bg] = await excerpt.evaluate(el => {
      const s = getComputedStyle(el)
      let n: Element | null = el
      // Walk up to find the card container background
      while (n && !(n instanceof HTMLElement)) n = n.parentElement
      while (n && getComputedStyle(n).backgroundColor === 'rgba(0, 0, 0, 0)') n = n.parentElement
      const cardBg = (n ? getComputedStyle(n).backgroundColor : 'rgb(20,21,24)')
      return [s.color, cardBg]
    })
    const ratio = contrastRatio(fg as string, bg as string)
    test.info().annotations.push({ type: 'metric', description: `contrast ≈ ${ratio.toFixed(2)}` })
    expect(ratio).toBeGreaterThanOrEqual(4.0)

    // Snapshot small region for quick visual diff
    // Note: baseline is created on first run
    await expect(card).toHaveScreenshot('cherry-card.png', { maxDiffPixelRatio: 0.02 })
  })
})

