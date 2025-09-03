import { test, expect } from "@playwright/test"

test("Assistant Outline inserts bullets", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: /create/i }).click()
  await page.getByRole("button", { name: /^outline$/i }).click()
  await page.getByRole("button", { name: /generate outline/i }).click()
  await expect(page.getByLabel(/body/i)).toHaveValue(/- Intro[\s\S]*- Key point 1/i)
})

