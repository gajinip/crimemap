import { expect, test, type Page } from '@playwright/test'

async function gotoView(page: Page, name: string) {
  const direct = page.getByRole('button', { name, exact: true })
  if (await direct.count()) {
    await direct.first().click()
    return
  }
  await page.getByRole('button', { name: 'More', exact: true }).click()
  await page.getByRole('menuitem', { name, exact: true }).click()
}

async function columns(page: Page, classFragment: string): Promise<number> {
  return page.evaluate((frag) => {
    const el = document.querySelector(`[class*="${frag}"]`)
    if (!el) return -1
    const value = getComputedStyle(el).gridTemplateColumns
    return value.split(' ').filter(Boolean).length
  }, classFragment)
}

test('no horizontal overflow across viewports', async ({ page }) => {
  test.setTimeout(180_000)
  for (const width of [360, 390, 430, 768, 1024, 1366, 1920]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await expect(page.getByText('Loading demo dataset')).toBeHidden({ timeout: 30000 })
    for (const view of [
      'Crime Map',
      'Dashboard',
      'Crime Trends',
      'Patrol Simulation',
      'Reports',
      'Police Stations',
      'Risk Zones',
      'Intelligence',
      'Risk Forecast',
    ]) {
      await gotoView(page, view)
      await page.waitForTimeout(120)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow, `${view} @${width}`).toBeLessThanOrEqual(0)
    }
  }
})

test('navigation swaps between sidebar and bottom bar', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 900 })
  await page.goto('/')
  await expect(page.getByText('Loading demo dataset')).toBeHidden({ timeout: 30000 })
  await expect(page.locator('nav[aria-label="Primary navigation"]')).toBeVisible()
  await expect(page.locator('aside[aria-label="Primary navigation"]')).toBeHidden()

  await page.setViewportSize({ width: 1366, height: 900 })
  await page.waitForTimeout(150)
  await expect(page.locator('aside[aria-label="Primary navigation"]')).toBeVisible()
  await expect(page.locator('nav[aria-label="Primary navigation"]')).toBeHidden()
})

test('map fills and resizes with the zone rail', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 })
  await page.goto('/')
  await expect(page.getByText('Loading demo dataset')).toBeHidden({ timeout: 30000 })
  await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 30000 })

  const full = await page.locator('.leaflet-container').boundingBox()
  expect(full!.height).toBeGreaterThan(500)
  expect(full!.width).toBeGreaterThan(500)

  await gotoView(page, 'Risk Zones')
  await page.getByRole('button', { name: /View details for/ }).first().click()
  await gotoView(page, 'Crime Map')
  await page.waitForTimeout(400)
  await expect(page.locator('aside[aria-label^="Risk analysis"]')).toBeVisible()

  const railed = await page.locator('.leaflet-container').boundingBox()
  expect(railed!.width).toBeLessThan(full!.width - 200)
  expect(railed!.height).toBeGreaterThan(500)
})

test('desktop tables and multi-column grids activate at md/lg', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 })
  await page.goto('/')
  await expect(page.getByText('Loading demo dataset')).toBeHidden({ timeout: 30000 })

  await gotoView(page, 'Police Stations')
  await expect(page.locator('[class*="md:block"] table')).toBeVisible()

  await gotoView(page, 'Reports')
  expect(await columns(page, 'md:grid-cols-3')).toBe(3)
  expect(await columns(page, 'xl:grid-cols-3')).toBe(3)
  await expect(page.locator('[class*="md:block"] table')).toBeVisible()

  await gotoView(page, 'Crime Trends')
  expect(await columns(page, 'lg:grid-cols-2')).toBe(2)
  expect(await columns(page, 'lg:grid-cols-3')).toBe(3)

  await gotoView(page, 'Patrol Simulation')
  expect(await columns(page, 'lg:grid-cols-12')).toBe(12)

  await gotoView(page, 'Risk Zones')
  expect(await columns(page, 'sm:grid-cols-2 xl:grid-cols-3')).toBe(3)
})

test('map filter panels are mutually exclusive', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 30000 })

  await page.getByRole('button', { name: 'Open crime filters' }).click()
  await expect(page.getByText('Crime filters')).toBeVisible()
  await page.getByRole('button', { name: 'Open area and date filters' }).click()
  await expect(page.getByText('Area & date')).toBeVisible()
  await expect(page.getByText('Crime filters')).toBeHidden()
})
