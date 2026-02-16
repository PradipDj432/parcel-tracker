import { test, expect, TEST_ADMIN, loginAs, mockApiRoutes } from "./fixtures";
import path from "path";
import fs from "fs";

test.describe("Bulk CSV Import", () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
    await loginAs(page, TEST_ADMIN.email, TEST_ADMIN.password);
  });

  test("import page shows upload UI", async ({ page }) => {
    await page.goto("/import");
    await expect(page.locator("h1")).toContainText("Bulk CSV Import");
    // Should show drop zone or file input area
    await expect(page.locator('input[accept=".csv"]')).toBeAttached();
  });

  test("import page requires authentication", async ({ page: rawPage }) => {
    // Use a fresh page without login
    const context = rawPage.context();
    const freshPage = await context.newPage();
    await freshPage.goto("/import");
    await freshPage.waitForURL("**/login", { timeout: 10_000 });
    await expect(freshPage).toHaveURL(/login/);
    await freshPage.close();
  });

  test("can upload a valid CSV and see review step", async ({ page }) => {
    await page.goto("/import");

    // Create a temporary CSV file
    const csvContent = "tracking_number,courier_code,label\nCSV123456,fedex,My Package\nCSV789012,ups,Another Package";
    const csvBuffer = Buffer.from(csvContent, "utf-8");

    // Upload the file via file chooser
    const fileInput = page.locator('input[accept=".csv"]');
    await fileInput.setInputFiles({
      name: "test-import.csv",
      mimeType: "text/csv",
      buffer: csvBuffer,
    });

    // Should show review step with valid entries
    await expect(page.locator("text=/\\d+ valid/")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator("text=CSV123456")).toBeVisible();
    await expect(page.locator("text=CSV789012")).toBeVisible();
  });

  test("shows validation errors for invalid CSV rows", async ({ page }) => {
    await page.goto("/import");

    // CSV with missing courier_code
    const csvContent =
      "tracking_number,courier_code,label\nCSV123456,,Missing Courier\n,ups,Missing Number";
    const csvBuffer = Buffer.from(csvContent, "utf-8");

    const fileInput = page.locator('input[accept=".csv"]');
    await fileInput.setInputFiles({
      name: "test-invalid.csv",
      mimeType: "text/csv",
      buffer: csvBuffer,
    });

    // Should show invalid count
    await expect(page.locator("text=/\\d+ invalid/")).toBeVisible({
      timeout: 5000,
    });
  });
});
