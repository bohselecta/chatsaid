import { test, expect } from '@playwright/test'

test('Nav Create opens CherryWriter if present', async ({ page }) => {
  await page.goto('/')
  const maybeCreate = page.getByRole('button', { name: /create a post/i })
  if (await maybeCreate.isVisible().catch(() => false)) {
    await maybeCreate.click()
    await expect(page.getByRole('dialog')).toBeVisible()
  }
})

