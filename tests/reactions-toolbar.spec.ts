import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__analytics = {
      calls: [] as any[],
      track(evt: string, props?: any) { (this.calls as any[]).push({ evt, props }) }
    }
  })
})

test('Reactions toolbar appears behind flag and emits analytics', async ({ page }) => {
  await page.goto('/canopy?enableReactions=1')
  await expect(page.getByRole('group', { name: /reactions/i })).toBeVisible()
  const funny = page.getByTestId('react-funny').first()
  await funny.click()
  const calls = await page.evaluate(() => (window as any).__analytics.calls)
  expect(calls.some((c: any) => c.evt === 'card_action_click' && c.props?.action === 'react' && c.props?.category === 'funny')).toBeTruthy()
})

