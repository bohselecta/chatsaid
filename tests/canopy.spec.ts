import { test, expect } from '@playwright/test'

test('EnhancedCanopyV3 is default at /canopy', async ({ page }) => {
  await page.goto('/canopy')
  await expect(page.getByRole('navigation', { name: /canopy categories/i })).toBeVisible()
})

test('Filter chip toggles updates URL', async ({ page }) => {
  await page.goto('/canopy')
  // Try to find a common category label button
  const candidates = ['Technical', 'Ideas', 'Weird', 'Research', 'Funny']
  let found = false
  for (const name of candidates) {
    const chip = page.getByRole('button', { name, exact: false })
    if (await chip.isVisible().catch(() => false)) {
      await chip.click()
      await expect(page).toHaveURL(/cat=/)
      // Click again to clear
      await chip.click()
      found = true
      break
    }
  }
  expect(found).toBeTruthy()
})

test('Search updates query param', async ({ page }) => {
  await page.goto('/canopy')
  const search = page.getByRole('searchbox', { name: /search posts/i })
  await search.fill('react')
  await expect(page).not.toHaveURL(/q=react/)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/q=react/)
})

test('Empty state appears when filters remove all posts', async ({ page }) => {
  await page.goto('/canopy?q=__unlikely_query__')
  await expect(page.getByRole('status', { name: /no posts/i })).toBeVisible()
})

test('Error state renders when simulateError=1', async ({ page }) => {
  await page.goto('/canopy?simulateError=1')
  await expect(page.getByRole('alert')).toBeVisible()
})
