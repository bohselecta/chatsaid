import { test, expect } from '@playwright/test'

test('Desk-cap, utility bar, and grid render', async ({ page }) => {
  await page.goto('/canopy')
  await expect(page.getByRole('navigation', { name: /categories/i })).toBeVisible()
  await expect(page.getByRole('search', { name: /search posts/i })).toBeVisible()
})

test('Category toggles update URL and filter state', async ({ page }) => {
  await page.goto('/canopy')
  const chip = page.getByRole('button', { name: /funny/i })
  await chip.click()
  await expect(page).toHaveURL(/cat=funny/)
  await expect(chip).toHaveAttribute('aria-pressed', 'true')
})

test('Search commits on Enter', async ({ page }) => {
  await page.goto('/canopy')
  const box = page.getByRole('searchbox', { name: /search posts/i })
  await box.fill('mind')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/q=mind/)
})

test('Sort changes URL', async ({ page }) => {
  await page.goto('/canopy')
  await page.selectOption('#sort', 'newest')
  await expect(page).toHaveURL(/sort=newest/)
})

