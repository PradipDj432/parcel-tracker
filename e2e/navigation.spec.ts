import { test, expect, TEST_ADMIN, loginAs } from "./fixtures";

test.describe("Navigation", () => {
  test("landing page loads with hero content", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Parcel Tracker")).toBeVisible();
    await expect(page.locator("text=Start Tracking")).toBeVisible();
  });

  test("navbar shows correct links for guests", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('a[href="/track"]')).toBeVisible();
    await expect(page.locator('a[href="/contact"]')).toBeVisible();
    await expect(page.locator('a[href="/login"]')).toBeVisible();
  });

  test("navbar shows correct links for logged-in users", async ({ page }) => {
    await loginAs(page, TEST_ADMIN.email, TEST_ADMIN.password);
    await page.goto("/dashboard");

    await expect(page.locator('a[href="/track"]')).toBeVisible();
    await expect(page.locator('a[href="/dashboard"]')).toBeVisible();
    await expect(page.locator('a[href="/history"]')).toBeVisible();
  });

  test("footer is visible on all pages", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("footer")).toBeVisible();

    await page.goto("/track");
    await expect(page.locator("footer")).toBeVisible();

    await page.goto("/contact");
    await expect(page.locator("footer")).toBeVisible();
  });

  test("dark mode toggle works", async ({ page }) => {
    await page.goto("/");
    // Find the theme toggle button
    const themeToggle = page.locator("button").filter({ has: page.locator("svg") }).first();

    // Get initial html class
    const initialClass = await page.locator("html").getAttribute("class");

    // Click toggle
    await themeToggle.click();

    // Class should change
    const newClass = await page.locator("html").getAttribute("class");
    expect(newClass).not.toBe(initialClass);
  });
});
