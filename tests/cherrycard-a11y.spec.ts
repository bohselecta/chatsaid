import { test, expect } from '@playwright/test'

test('CherryCard actions are keyboard reachable and labeled', async ({ page }) => {
  await page.goto('/canopy')

  const card = page.getByTestId('cherry-card').first()
  await expect(card).toBeVisible()

  const saveBtn = page.getByTestId('card-action-save').first()
  await expect(saveBtn).toHaveAttribute('aria-label', /save to my room/i)
  await saveBtn.focus()
  await expect(saveBtn).toBeFocused()

  const likeBtn = page.getByTestId('card-action-like').first()
  await likeBtn.focus()
  const before = await likeBtn.getAttribute('aria-pressed')
  await page.keyboard.press('Enter')
  const after = await likeBtn.getAttribute('aria-pressed')
  expect(after).not.toBe(before)
})

