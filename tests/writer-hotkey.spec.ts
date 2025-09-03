import { test, expect } from '@playwright/test'

test('Cmd/Ctrl+J opens writer', async ({ page }) => {
  await page.goto('/canopy')
  const isMac = process.platform === 'darwin'
  await page.keyboard.press(isMac ? 'Meta+J' : 'Control+J')
  await expect(page.getByRole('dialog', { name: /cherry writer/i })).toBeVisible()
})

