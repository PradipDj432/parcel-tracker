import { test as base, type Page } from "@playwright/test";

// ---- Mock data ----

export const MOCK_TRACKING_RESULT = {
  data: {
    tracking_number: "MOCK123456789",
    courier_code: "ups",
    courier_name: "UPS",
    status: "transit",
    last_event: "Package in transit to destination",
    origin: "New York, US",
    destination: "Los Angeles, US",
    estimated_delivery: "2026-02-20",
    checkpoints: [
      {
        date: "2026-02-16T10:00:00Z",
        description: "Package in transit to destination",
        location: "Chicago, IL",
        status: "transit",
      },
      {
        date: "2026-02-15T08:30:00Z",
        description: "Package picked up",
        location: "New York, NY",
        status: "pickup",
      },
    ],
  },
  saved: true,
  saveError: null,
};

export const MOCK_DETECT_RESULT = {
  data: [
    { name: "UPS", code: "ups" },
    { name: "FedEx", code: "fedex" },
  ],
};

export const MOCK_IMPORT_RESULT = {
  data: {
    tracking_number: "CSV123456",
    courier_code: "fedex",
    status: "transit",
    last_event: "In transit",
    checkpoints: [],
  },
};

// ---- Helpers ----

/**
 * Mock all external API routes so tests don't hit real services.
 * Uses exact URL path matching to avoid intercepting page navigations.
 */
export async function mockApiRoutes(page: Page) {
  // Mock courier detection
  await page.route("**/api/track/detect", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_DETECT_RESULT),
    })
  );

  // Mock tracking API — only intercept POST to /api/track
  await page.route("**/api/track", (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() === "POST" && url.pathname === "/api/track") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_TRACKING_RESULT),
      });
    }
    return route.continue();
  });

  // Mock import API
  await page.route("**/api/import", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_IMPORT_RESULT),
    })
  );

  // Mock contact form API
  await page.route("**/api/contact", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    })
  );
}

/**
 * Login with email and password using the actual Supabase auth.
 */
export async function loginAs(
  page: Page,
  email: string,
  password: string
) {
  await page.goto("/login");
  await page.fill('input[id="email"]', email);
  await page.fill('input[id="password"]', password);
  await page.click('button[type="submit"]');
  // Wait for redirect to dashboard
  await page.waitForURL("**/dashboard", { timeout: 10_000 });
  // Wait for auth state to fully load (profile fetch)
  await page.waitForTimeout(1000);
}

// Test accounts (created in Supabase)
export const TEST_ADMIN = {
  email: "pradipadmin@yopmail.com",
  password: "Abc@12345",
};

export const TEST_USER = {
  email: "pradip1231@yopmail.com",
  password: "Abc@12345",
};

// Custom test fixture with API mocks pre-applied
export const test = base.extend<{ mockPage: Page }>({
  mockPage: async ({ page }, use) => {
    await mockApiRoutes(page);
    await use(page);
  },
});

export { expect } from "@playwright/test";
