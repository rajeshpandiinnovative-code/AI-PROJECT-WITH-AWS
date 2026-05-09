import { expect, test } from "@playwright/test";

test.describe("public routes", () => {
  test("landing loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("visualizations shows insight heading", async ({ page }) => {
    await page.goto("/visualizations");
    await expect(page.getByRole("heading", { name: /insight visualizations/i })).toBeVisible();
  });

  test("pricing plans page loads", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("heading", { name: /plans.*billing/i })).toBeVisible();
  });
});

test.describe("auth gates", () => {
  test("dashboard redirects anonymous users to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?.*callbackUrl=/);
  });
});
