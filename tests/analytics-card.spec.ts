import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__analytics = {
      calls: [] as any[],
      track(evt: string, props?: any) { (this.calls as any[]).push({ evt, props }) }
    }
  })
})

test('Like emits analytics', async ({ page }) => {
  await page.goto('/canopy')
  const like = page.getByTestId('card-action-like').first()
  await like.click()
  const calls = await page.evaluate(() => (window as any).__analytics.calls)
  expect(calls.some((c: any) => c.evt === 'card_action_click' && c.props?.action === 'like')).toBeTruthy()
})

test('Category save emits analytics', async ({ page }) => {
  await page.goto('/canopy')
  // Open the save/collection panel first
  const open = page.getByTestId('card-action-save').first()
  if (await open.isVisible().catch(() => false)) {
    await open.click()
  }
  const saveBtn = page.locator('[data-testid^="save-"]').first()
  await saveBtn.click()
  const calls = await page.evaluate(() => (window as any).__analytics.calls)
  expect(calls.some((c: any) => c.evt === 'card_action_click' && c.props?.action === 'save')).toBeTruthy()
})

