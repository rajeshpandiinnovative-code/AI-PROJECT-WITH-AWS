import { expect, test } from "@playwright/test";

test.describe("public routes", () => {
  test("landing loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /^sign in$/i })).toBeVisible();
  });

  test("register page loads", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /create account/i })).toBeVisible();
  });

  test("onboarding claim school loads", async ({ page }) => {
    await page.goto("/onboarding");
    await expect(page.getByRole("heading", { name: /claim your school/i })).toBeVisible();
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
