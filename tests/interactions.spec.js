import { test, expect } from "@playwright/test";

test.use({ channel: "msedge" });

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:3002");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("all navigation and help controls have a visible effect", async ({ page }) => {
  await page.getByRole("button", { name: /Nháp nhanh/ }).click();
  await expect(page.getByRole("heading", { name: "Nói ngắn gọn điều bạn cần" })).toBeVisible();
  await page.getByRole("button", { name: "Cách dùng" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Đóng hướng dẫn" }).click();
  await page.getByRole("button", { name: /Chỉnh sửa/ }).click();
  await expect(page.getByRole("heading", { name: "Đưa nội dung cần biên tập vào bàn làm việc" })).toBeVisible();
  await page.getByLabel("Nội dung hiện tại").fill("Bản gốc cần giữ lại khi chuyển tác vụ.");
  await page.getByRole("button", { name: /Mở hướng/ }).click();
  await expect(page.getByRole("heading", { name: "Xác định vấn đề cần mở thêm hướng" })).toBeVisible();
  await page.getByRole("button", { name: /Chỉnh sửa/ }).click();
  await expect(page.getByLabel("Nội dung hiện tại")).toHaveValue("Bản gốc cần giữ lại khi chuyển tác vụ.");
});

test("validation opens AI settings and points to the first missing field", async ({ page }) => {
  await page.getByRole("button", { name: "Tạo bản nội dung" }).click();
  await expect(page.locator(".ai-settings")).toHaveAttribute("open", "");
  await expect(page.getByLabel("Khóa truy cập API")).toHaveAttribute("aria-invalid", "true");
  await page.getByLabel("Khóa truy cập API").fill("fake-key");
  await page.locator(".ai-settings summary").click();
  await page.getByRole("button", { name: /Mở hướng/ }).click();
  await page.getByRole("button", { name: "Mở danh sách ý tưởng" }).click();
  await expect(page.getByLabel("Chủ thể cần khai phá")).toHaveAttribute("aria-invalid", "true");
});

test("mode selection returns to composing and clears stale validation", async ({ page }) => {
  await page.getByRole("button", { name: /Mở hướng/ }).click();
  await page.getByRole("button", { name: /Chỉ đạo/ }).click();
  await expect(page.getByRole("heading", { name: "Dựng đường đi của ý tưởng trước khi viết" })).toBeVisible();
  await expect(page.getByText("Mở danh sách ý tưởng", { exact: true })).toHaveCount(0);
});

test("mobile layout has no horizontal page overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  const dimensions = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport);
});
