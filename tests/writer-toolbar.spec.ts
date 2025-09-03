import { test, expect } from "@playwright/test"

test("Category chips toggle aria-pressed", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: /create/i }).click()
  const chip = page.getByRole("button", { name: /technical/i })
  const prev = await chip.getAttribute("aria-pressed")
  await chip.click()
  await expect(chip).not.toHaveAttribute("aria-pressed", prev!)
})

