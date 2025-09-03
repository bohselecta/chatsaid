import { test, expect } from "@playwright/test"

test("Stats update with body text", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: /create/i }).click()
  const body = page.getByLabel(/body/i)
  await body.fill("One two three four five six seven eight nine ten.")
  await expect(page.getByText(/words/i)).toBeVisible()
})

