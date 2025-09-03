import { test, expect } from '@playwright/test'

test('Landing CTA opens writer modal', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /open the assistant/i }).click()
  await expect(page.getByRole('dialog', { name: /cherry writer/i })).toBeVisible()
})

