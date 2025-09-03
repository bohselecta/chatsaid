import { test, expect } from '@playwright/test'

const BASE = process.env.BASE_URL || 'http://localhost:3002'
const VIBE_SLUG = process.env.TEST_VIBE_SLUG || ''

test.describe('Assistant → Vibe → Draft flow', () => {
  test('attach a vibe app via picker and see it in Draft Panel', async ({ page }) => {
    await page.goto(`${BASE}/canopy`)

    // Open assistant if needed
    const launcher = page.getByTestId('bot-launcher')
    if (await launcher.isVisible().catch(() => false)) {
      await launcher.click()
    }

    const assistantInput = page.getByTestId('assistant-input')
    await assistantInput.click()

    const query = VIBE_SLUG ? `attach vibe ${VIBE_SLUG}` : 'attach vibe'
    await assistantInput.fill(query)
    await assistantInput.press('Enter')

    // If there is an explicit button on card, click it
    const maybePickBtn = page.getByTestId('pick-vibe-btn')
    if (await maybePickBtn.isVisible().catch(() => false)) {
      await maybePickBtn.click()
    }

    // Choose vibe
    if (VIBE_SLUG) {
      await page.getByTestId(`vibe-item-${VIBE_SLUG}`).click()
    } else {
      await page.locator('[data-testid^="vibe-item-"]').first().click()
    }

    // Attach
    await page.getByRole('button', { name: /^attach$/i }).click()

    // Draft panel shows vibe
    await expect(page.getByTestId('draft-panel')).toBeVisible()
    await expect(page.getByTestId('draft-vibe')).toBeVisible()
  })

  test('no CSP errors when loading a vibe iframe', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Console capture flaky on webkit')
    const errors: string[] = []
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })

    await page.goto(`${BASE}/canopy`)
    await page.waitForTimeout(1500)

    const redFlags = errors.filter(e => /Content Security Policy|Refused to frame|blocked by CORS|X-Frame-Options/i.test(e))
    expect(redFlags, `Console had CSP/frame errors:\n${redFlags.join('\n')}`).toEqual([])
  })
})
