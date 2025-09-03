import { test, expect } from '@playwright/test'

test('Landing opens writer via global launcher and restores focus', async ({ page }) => {
  await page.goto('/')
  const btn = page.getByRole('button', { name: /open the assistant/i })
  await btn.focus()
  await btn.click()
  const dialog = page.getByRole('dialog', { name: /cherry writer/i })
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(btn).toBeFocused()
})

test('Guide panel opens writer with seed', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 })
  await page.goto('/canopy')
  await page.getByRole('button', { name: /create with chatsaid|start a quick draft|quick draft|try a quick outline/i }).click()
  await expect(page.getByRole('dialog', { name: /cherry writer/i })).toBeVisible()
  await expect(page.getByLabel(/Title/i)).toHaveValue(/quick outline/i)
  await expect(page.getByLabel(/Body/i)).toBeVisible()
})
