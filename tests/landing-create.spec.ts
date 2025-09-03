import { test, expect } from '@playwright/test'

test('Landing has 3 modules and Create opens the writer', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /a social network for ideas, posts, and discovery/i })).toBeVisible()
  const create = page.getByRole('button', { name: /create: launch cherrywriter/i })
  const discover = page.getByRole('link', { name: /discover:/i })
  const organize = page.getByRole('link', { name: /organize:/i })
  await expect(create).toBeVisible()
  await expect(discover).toBeVisible()
  await expect(organize).toBeVisible()

  await create.focus()
  await create.click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(create).toBeFocused()
})
