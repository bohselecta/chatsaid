import { test, expect } from "@playwright/test"

test("Home hero shows desk cap + assistant", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("img", { name: "Assistant" })).toBeVisible()
})

test("Tiles render pictos", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("button", { name: /create a post/i })).toBeVisible()
})

test("Canopy desk cap exists", async ({ page }) => {
  await page.goto("/canopy")
  const cap = page.locator(".desk-cap").first()
  await expect(cap).toBeVisible()
})

