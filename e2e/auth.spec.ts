import { test, expect, TEST_ADMIN, loginAs } from "./fixtures";

test.describe("Authentication", () => {
  test("shows login form with email and password fields", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("shows signup form with email, password, and confirm password", async ({
    page,
  }) => {
    await page.goto("/signup");
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('input[id="confirmPassword"]')).toBeVisible();
  });

  test("login with valid credentials redirects to dashboard", async ({
    page,
  }) => {
    await loginAs(page, TEST_ADMIN.email, TEST_ADMIN.password);
    await expect(page).toHaveURL(/dashboard/);
    // Dashboard heading should be visible
    await expect(page.locator("h1")).toContainText("Dashboard");
  });

  test("login with invalid credentials shows error toast", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.fill('input[id="email"]', "wrong@example.com");
    await page.fill('input[id="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    // Should show error toast (Sonner renders in [data-sonner-toaster])
    await expect(page.locator("[data-sonner-toaster]")).toContainText(
      /invalid/i,
      { timeout: 5000 }
    );
  });

  test("protected route /dashboard redirects to /login when not authenticated", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForURL("**/login", { timeout: 10_000 });
    await expect(page).toHaveURL(/login/);
  });

  test("protected route /history redirects to /login when not authenticated", async ({
    page,
  }) => {
    await page.goto("/history");
    await page.waitForURL("**/login", { timeout: 10_000 });
    await expect(page).toHaveURL(/login/);
  });

  test("logout returns to home page", async ({ page }) => {
    await loginAs(page, TEST_ADMIN.email, TEST_ADMIN.password);
    // Click sign out (LogOut icon button on desktop)
    await page.click('button[title="Sign out"]');
    await page.waitForURL("/", { timeout: 10_000 });
    await expect(page).toHaveURL("/");
  });

  test("link between login and signup works", async ({ page }) => {
    await page.goto("/login");
    await page.click('a[href="/signup"]');
    await expect(page).toHaveURL(/signup/);

    await page.click('a[href="/login"]');
    await expect(page).toHaveURL(/login/);
  });
});
