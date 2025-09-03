import { test, expect } from "@playwright/test"

test("Dev 500 trigger shows global error page", async ({ page }) => {
  await page.goto("/boom?500=1")
  await expect(page.getByRole("heading", { name: /500/ })).toBeVisible()
  await expect(page.getByRole("link", { name: "Back to Home" })).toBeVisible()
})

