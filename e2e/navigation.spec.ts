import { test, expect, TEST_ADMIN, loginAs } from "./fixtures";

test.describe("Navigation", () => {
  test("landing page loads with hero content", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByRole("link", { name: "Start Tracking" })).toBeVisible();
  });

  test("navbar shows correct links for guests", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav").locator('a[href="/track"]')).toBeVisible();
    await expect(page.locator("nav").locator('a[href="/contact"]')).toBeVisible();
    await expect(page.locator("nav").locator('a[href="/login"]')).toBeVisible();
  });

  test("navbar shows correct links for logged-in users", async ({ page }) => {
    await loginAs(page, TEST_ADMIN.email, TEST_ADMIN.password);
    await page.goto("/dashboard");
    await page.waitForTimeout(1000);

    await expect(page.locator("nav").locator('a[href="/track"]')).toBeVisible();
    await expect(page.locator("nav").locator('a[href="/dashboard"]')).toBeVisible();
    await expect(page.locator("nav").locator('a[href="/history"]')).toBeVisible();
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
    const toggle = page.locator('button[aria-label="Toggle theme"]');
    await expect(toggle).toBeVisible();

    // Get initial html class
    const initialClass = await page.locator("html").getAttribute("class");

    // Click toggle
    await toggle.click();
    await page.waitForTimeout(500);

    // Class should change
    const newClass = await page.locator("html").getAttribute("class");
    expect(newClass).not.toBe(initialClass);
  });
});
