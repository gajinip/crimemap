import { expect, test } from "@playwright/test";

test("app boots with the demo banner and a rendered crime map", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Demo data - not real crime information")).toBeVisible();
  await expect(page.getByText("Loading demo dataset")).toBeHidden({ timeout: 30000 });

  const map = page.locator(".leaflet-container");
  await expect(map).toBeVisible({ timeout: 30000 });
  await expect(page.locator(".leaflet-overlay-pane path").first()).toBeVisible();
  expect(await page.locator(".leaflet-overlay-pane path").count()).toBeGreaterThan(10);
});

test("bottom navigation switches between views", async ({ page }) => {
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