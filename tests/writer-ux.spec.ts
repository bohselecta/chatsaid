import { test, expect } from '@playwright/test'

test('Preview toggles and publish gating', async ({ page }) => {
  await page.goto('/')
  // Try nav or landing create
  const createBtn = page.getByRole('button', { name: /create/i }).first()
  await createBtn.click()
  const dialog = page.getByRole('dialog', { name: /cherry writer/i })
  await expect(dialog).toBeVisible()

  const publish = page.getByRole('button', { name: /^publish$/i })
  if (await publish.isVisible().catch(() => false)) {
    await expect(publish).toBeDisabled()
    await page.getByLabel(/title/i).fill('Hello world')
    await page.getByLabel(/body/i).fill('This body passes the minimum length threshold for publishing.')
    await expect(publish).toBeEnabled()
  }

  const previewBtn = page.getByRole('button', { name: /preview/i }).first()
  await previewBtn.click()
  await expect(page.getByRole('button', { name: /exit preview/i })).toBeVisible()
})

