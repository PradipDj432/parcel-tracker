import { test, expect, TEST_ADMIN, loginAs } from "./fixtures";

test.describe("Admin Panel", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_ADMIN.email, TEST_ADMIN.password);
  });

  test("admin can access admin panel", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("h1")).toContainText("Admin Panel");
  });

  test("admin panel shows overview tab by default", async ({ page }) => {
    await page.goto("/admin");

    // Should show stat cards
    await expect(page.locator("text=Total Users")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator("text=Total Trackings")).toBeVisible();
    await expect(page.locator("text=Contact Messages")).toBeVisible();
  });

  test("admin can switch between tabs", async ({ page }) => {
    await page.goto("/admin");

    // Wait for admin panel to load
    await expect(page.locator("text=Total Users")).toBeVisible({
      timeout: 10_000,
    });

    // Switch to Users tab
    await page.click("button:has-text('Users')");
    await expect(
      page.locator('input[placeholder="Search by email..."]')
    ).toBeVisible();

    // Switch to Trackings tab
    await page.click("button:has-text('Trackings')");
    await expect(
      page.locator('input[placeholder*="Search number"]')
    ).toBeVisible();

    // Switch to Messages tab
    await page.click("button:has-text('Messages')");
    await expect(
      page.locator('input[placeholder="Search messages..."]')
    ).toBeVisible();
  });

  test("users tab shows admin user", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("text=Total Users")).toBeVisible({
      timeout: 10_000,
    });

    await page.click("button:has-text('Users')");

    // Use main content area to avoid matching the navbar email
    await expect(
      page.locator("main").locator(`text=${TEST_ADMIN.email}`).first()
    ).toBeVisible();
  });
});

test.describe("Admin Access Control", () => {
  test("non-admin cannot access admin panel", async ({ page }) => {
    // Try accessing admin without login - should redirect
    await page.goto("/admin");
    // Should redirect to login or show unauthorized
    await page.waitForURL(/\/(login|dashboard)/, { timeout: 10_000 });
  });
});
