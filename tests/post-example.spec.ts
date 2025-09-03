import { test, expect } from "@playwright/test"

test("Example post renders with heading", async ({ page }) => {
  await page.goto("/post/example")
  await expect(page.getByRole("heading", { name: /Example Post/i })).toBeVisible()
})

