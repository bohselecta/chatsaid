import { test, expect } from '@playwright/test'

test('Landing hero and 3 tiles render', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /a social network for ideas, posts, and discovery/i })).toBeVisible()
  await expect(page.getByRole('navigation', { name: /main actions/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /create: launch cherrywriter/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /discover:/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /organize:/i })).toBeVisible()
})
