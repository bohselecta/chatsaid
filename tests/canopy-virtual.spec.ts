import { test, expect } from "@playwright/test"

test("Virtualized canopy renders and scrolls", async ({ page }) => {
  await page.goto("/canopy?seed=120")
  await expect(page.getByRole("navigation", { name: /categories/i })).toBeVisible()
  await page.mouse.wheel(0, 2000)
  await expect(page.getByTestId("cherry-card").first()).toBeVisible()
})
