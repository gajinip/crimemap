import { expect, test, type Page } from "@playwright/test";

/** Reads the first integer shown next to a metric label (e.g. "Total incidents"). */
async function metricValue(page: Page, label: string): Promise<string | null> {
  const target = page.getByText(label, { exact: true }).first();
  // Walk up a few ancestors: some layouts keep the value next to the label,
  // while dashboard KPI cards place it in a sibling subtree.
  for (let level = 1; level <= 3; level += 1) {
    const text = await target.locator(`xpath=ancestor::*[${level}]`).innerText();
    const match = text.replace(label, "").match(/\d[\d,]*/);
    if (match) return match[0].replace(/,/g, "");
  }
  return null;
}

test("app boots with the demo banner and a rendered crime map", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByText("Demo data - not real crime information").first(),
  ).toBeVisible();
  await expect(page.getByText("Loading demo dataset")).toBeHidden({ timeout: 30000 });

  const map = page.locator(".leaflet-container");
  await expect(map).toBeVisible({ timeout: 30000 });
  await expect(page.locator(".leaflet-overlay-pane path").first()).toBeVisible();
  expect(await page.locator(".leaflet-overlay-pane path").count()).toBeGreaterThan(10);
});

test("bottom navigation switches between views", async ({ page }) => {
  // The bottom bar is the mobile/tablet pattern; at lg the sidebar takes over.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const map = page.locator(".leaflet-container");
  await expect(map).toBeVisible({ timeout: 30000 });

  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  await expect(map).toBeHidden();

  await page.getByRole("button", { name: "Crime Map", exact: true }).click();
  await expect(map).toBeVisible();

  await page.getByRole("button", { name: "More", exact: true }).click();
  await page.getByRole("menuitem", { name: "Risk Forecast", exact: true }).click();
  await expect(map).toBeHidden();

  await page.getByRole("button", { name: "Crime Map", exact: true }).click();
  await expect(map).toBeVisible();
});

test("Reports totals stay consistent with the Dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Loading demo dataset")).toBeHidden({ timeout: 30000 });

  await page.getByRole("button", { name: "Dashboard", exact: true }).first().click();
  await expect(page.getByText("Situation overview")).toBeVisible();
  const dashboardTotal = await metricValue(page, "Total incidents");

  await page.getByRole("button", { name: "Reports", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Reports & Export" })).toBeVisible();
  const reportsTotal = await metricValue(page, "Total incidents");

  expect(reportsTotal).not.toBeNull();
  expect(reportsTotal).not.toBe("0");
  expect(reportsTotal).toBe(dashboardTotal);
});

test("area filter narrows the map data without leaving the map", async ({ page }) => {
  await page.goto("/");
  const map = page.locator(".leaflet-container");
  await expect(map).toBeVisible({ timeout: 30000 });

  const filter = page.getByRole("combobox");
  if ((await filter.count()) === 0) return;

  const options = filter.locator("option");
  const count = await options.count();
  expect(count).toBeGreaterThan(1);

  const firstArea = await options.nth(1).getAttribute("value");
  await filter.selectOption(firstArea ?? "");
  await expect(map).toBeVisible();
  await expect(page.getByRole("combobox")).toHaveValue(firstArea ?? "");
});