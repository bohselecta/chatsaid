import { test, expect } from '@playwright/test'

test('Templates open writer with seeds', async ({ page }) => {
  await page.goto('/create')
  await page.getByRole('button', { name: /use template: quick post/i }).click()
  await expect(page.getByRole('dialog', { name: /cherry writer/i })).toBeVisible()
  await expect(page.getByLabel(/title/i)).toHaveValue(/quick post/i)
})

test('Deep link seeds open writer', async ({ page }) => {
  await page.goto('/create?title=Hello&body=World')
  await expect(page.getByRole('dialog', { name: /cherry writer/i })).toBeVisible()
})

