import { test, expect } from "@playwright/test"

test("404 page offers recovery actions", async ({ page }) => {
  await page.goto("/definitely-not-a-real-page")
  await expect(page.getByRole("heading", { name: /404/ })).toBeVisible()
  await expect(page.getByRole("link", { name: "Back to Home" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Open Writer" })).toBeVisible()
})

