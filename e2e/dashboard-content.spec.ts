import { expect, test } from "@playwright/test";

test.describe("Dashboard URLs (Chromium)", () => {
  test("school dashboard — unauthenticated gate", async ({ page }) => {
    const res = await page.goto("/school/dashboard", { waitUntil: "commit", timeout: 90_000 });
    expect(res?.status(), "HTTP status should be OK or redirect").toBeLessThan(400);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await page.screenshot({ path: "test-results/dash-school-unauth.png", fullPage: true });
  });

  test("admin dashboard — unauthenticated gate", async ({ page }) => {
    const res = await page.goto("/admin/dashboard", { waitUntil: "commit", timeout: 90_000 });
    expect(res?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/login/);
    await page.screenshot({ path: "test-results/dash-admin-unauth.png", fullPage: true });
  });

  test("public visualizations — same chart stack as dashboard insights", async ({ page }) => {
    await page.goto("/visualizations", { waitUntil: "commit", timeout: 90_000 });
    await expect(page.getByRole("heading", { name: "Insight visualizations" })).toBeVisible();
    await expect(page.getByText("Interactive charts powered by the same insight UI")).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
    await page.screenshot({ path: "test-results/dash-visualizations-public.png", fullPage: true });
  });
});
