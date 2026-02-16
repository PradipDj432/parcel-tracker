import { test, expect, mockApiRoutes } from "./fixtures";

test.describe("Contact Form", () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
  });

  test("shows contact form with all fields", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator("h1")).toContainText("Contact Us");
    await expect(page.locator('input[id="name"]')).toBeVisible();
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="subject"]')).toBeVisible();
    await expect(page.locator('textarea[id="message"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("shows validation errors for empty submission", async ({ page }) => {
    await page.goto("/contact");
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator("text=Name is required")).toBeVisible();
    await expect(page.locator("text=Subject is required")).toBeVisible();
  });

  test("shows validation error for short message", async ({ page }) => {
    await page.goto("/contact");
    await page.fill('input[id="name"]', "Test User");
    await page.fill('input[id="email"]', "test@example.com");
    await page.fill('input[id="subject"]', "Test Subject");
    await page.fill('textarea[id="message"]', "Short");
    await page.click('button[type="submit"]');

    await expect(
      page.locator("text=Message must be at least 10 characters")
    ).toBeVisible();
  });

  test("submits successfully and shows thank-you screen", async ({ page }) => {
    await page.goto("/contact");
    await page.fill('input[id="name"]', "Test User");
    await page.fill('input[id="email"]', "test@example.com");
    await page.fill('input[id="subject"]', "Test Subject");
    await page.fill(
      'textarea[id="message"]',
      "This is a test message with enough characters to pass validation."
    );
    await page.click('button[type="submit"]');

    // Should show success screen
    await expect(page.locator("text=Thank you")).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.locator("text=Your message has been sent")
    ).toBeVisible();

    // Should have "Send another message" button
    await expect(
      page.locator("button:has-text('Send another message')")
    ).toBeVisible();
  });

  test("can reset form after successful submission", async ({ page }) => {
    await page.goto("/contact");
    await page.fill('input[id="name"]', "Test User");
    await page.fill('input[id="email"]', "test@example.com");
    await page.fill('input[id="subject"]', "Test Subject");
    await page.fill(
      'textarea[id="message"]',
      "This is a test message with enough characters."
    );
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Thank you")).toBeVisible({
      timeout: 5000,
    });

    // Click "Send another message"
    await page.click("button:has-text('Send another message')");

    // Form should be visible again with empty fields
    await expect(page.locator('input[id="name"]')).toBeVisible();
    await expect(page.locator('input[id="name"]')).toHaveValue("");
  });

  test("shows character counter for message", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator("text=0/2000")).toBeVisible();

    await page.fill('textarea[id="message"]', "Hello World");
    await expect(page.locator("text=11/2000")).toBeVisible();
  });
});
