import { test, expect } from '@playwright/test'

test('Guide panel visible on canopy (desktop)', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 })
  await page.goto('/canopy')
  await expect(page.getByText(/need a nudge/i)).toBeVisible()
})

