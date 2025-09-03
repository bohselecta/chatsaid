import { test, expect } from "@playwright/test"

test("Canopy shows skeletons when delayed", async ({ page }) => {
  await page.goto("/canopy?seed=120&delay=300")
  await expect(page.locator(".skel").first()).toBeVisible()
  await page.waitForTimeout(450)
  await expect(page.getByTestId("cherry-card").first()).toBeVisible()
})

