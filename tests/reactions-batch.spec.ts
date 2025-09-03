import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__batchCalls = []
    const orig = console.log
    // @ts-ignore
    console.log = (...args: any[]) => {
      if (args[0] === '[dev] batched reactions') {
        ;(window as any).__batchCalls.push(args[1])
      }
      orig(...args)
    }
  })
})

test('Batched reactions flush once per burst when flag enabled', async ({ page }) => {
  // Enable toolbar; batch flag can be passed via query param in this build
  await page.goto('/canopy?enableReactions=1&enableBatch=1')
  const funny = page.getByTestId('react-funny').first()
  await funny.click()
  await funny.click()
  await funny.click()
  await page.waitForTimeout(350)

  const calls = await page.evaluate(() => (window as any).__batchCalls)
  expect(calls.length).toBeGreaterThan(0)
  expect(calls[0]).toHaveProperty('deltas')
  expect(calls[0].deltas.funny).toBe(3)
})

