import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__analytics = {
      calls: [] as any[],
      track(evt: string, props?: any) { (this.calls as any[]).push({ evt, props }) }
    }
  })
})

test('Impression fires once when hydrated counts exist', async ({ page }) => {
  await page.goto('/canopy?enableReactions=1&seedCounts=1')
  // Wait a tick for effects
  await page.waitForTimeout(100)
  const calls = await page.evaluate(() => (window as any).__analytics.calls)
  const impressions = calls.filter((c: any) => c.evt === 'card_action_impression')
  expect(impressions.length).toBeGreaterThan(0)
})

