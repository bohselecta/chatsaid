import { test, expect } from '@playwright/test'

test('Reaction counts increment and coalesce under debounce', async ({ page }) => {
  // Enable toolbar and stub analytics (optional)
  await page.addInitScript(() => {
    (window as any).__analytics = { calls: [], track(evt: string, props?: any){ this.calls.push({evt, props}) } }
  })

  await page.goto('/canopy?enableReactions=1')

  const funnyBtn = page.getByTestId('react-funny').first()
  const funnyCount = page.getByTestId('react-count-funny').first()

  const start = Number((await funnyCount.textContent()) || '0')

  // Rapid triple click; optimistic UI should jump by 3
  await funnyBtn.click()
  await funnyBtn.click()
  await funnyBtn.click()

  await expect(funnyCount).toHaveText(String(start + 3))

  // Wait past debounce to settle
  await page.waitForTimeout(350)
  await expect(funnyCount).toHaveText(String(start + 3))
})

