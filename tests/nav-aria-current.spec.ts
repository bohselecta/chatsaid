import { test, expect } from "@playwright/test"

test("Nav sets aria-current on the active page", async ({ page }) => {
  await page.goto("/")
  const homeLink = page.getByRole("link", { name: "Home" })
  await expect(homeLink).toHaveAttribute("aria-current", "page")

  await page.goto("/explore")
  const discover = page.getByRole("link", { name: "Discover" })
  await expect(discover).toHaveAttribute("aria-current", "page")
})

