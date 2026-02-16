import {
  test,
  expect,
  mockApiRoutes,
  TEST_ADMIN,
  loginAs,
} from "./fixtures";

test.describe("Guest Tracking", () => {
  test("guest can track a single parcel", async ({ page }) => {
    await mockApiRoutes(page);
    await page.goto("/track");

    // Page heading should be visible
    await expect(page.locator("h1")).toContainText("Track a Parcel");

    // Enter tracking number
    await page.fill(
      'input[placeholder="Enter tracking number"]',
      "MOCK123456789"
    );

    // Wait for courier detection to complete (mocked)
    await page.waitForTimeout(700);

    // Select detected courier
    const courierSelect = page.locator("select").first();
    await courierSelect.selectOption("ups");

    // Click Track button
    await page.click("text=Track");

    // Should show tracking result card
    await expect(page.locator("text=MOCK123456789")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator("text=In Transit")).toBeVisible();
    await expect(
      page.locator("text=Package in transit to destination")
    ).toBeVisible();
  });

  test("guest cannot add more than one tracking field", async ({ page }) => {
    await page.goto("/track");
    // The "Add tracking number" button should NOT be visible for guests
    // (guest max is 1 field)
    await expect(page.locator("text=Add tracking number")).not.toBeVisible();
  });

  test("guest sees sign-in prompt", async ({ page }) => {
    await page.goto("/track");
    await expect(
      page.locator("text=Sign in to track up to 6 parcels")
    ).toBeVisible();
  });
});

test.describe("Logged-in Tracking", () => {
  test("logged-in user can add multiple tracking fields", async ({ page }) => {
    await mockApiRoutes(page);
    await loginAs(page, TEST_ADMIN.email, TEST_ADMIN.password);

    await page.goto("/track");

    // Should be able to add more fields
    await expect(page.locator("text=Add tracking number")).toBeVisible();

    // Click add
    await page.click("text=Add tracking number");

    // Should now have 2 tracking number inputs
    const inputs = page.locator('input[placeholder="Enter tracking number"]');
    await expect(inputs).toHaveCount(2);
  });

  test("logged-in user can track and see results", async ({ page }) => {
    await mockApiRoutes(page);
    await loginAs(page, TEST_ADMIN.email, TEST_ADMIN.password);

    await page.goto("/track");

    // Fill tracking number
    await page.fill(
      'input[placeholder="Enter tracking number"]',
      "MOCK123456789"
    );

    await page.waitForTimeout(700);
    const courierSelect = page.locator("select").first();
    await courierSelect.selectOption("ups");

    await page.click("text=Track");

    // Should show result
    await expect(page.locator("text=MOCK123456789")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator("text=UPS")).toBeVisible();
  });

  test("history page shows tracked parcels", async ({ page }) => {
    await loginAs(page, TEST_ADMIN.email, TEST_ADMIN.password);

    await page.goto("/history");
    await expect(page.locator("h1")).toContainText("History");

    // Should either show a list of trackings or the empty state
    const hasTrackings = await page.locator(".font-mono").first().isVisible().catch(() => false);
    const hasEmpty = await page.locator("text=No trackings yet").isVisible().catch(() => false);

    expect(hasTrackings || hasEmpty).toBeTruthy();
  });
});
