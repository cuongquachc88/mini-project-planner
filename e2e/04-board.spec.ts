import { test, expect } from '@playwright/test'
import { setupIdentity, createProject } from './helpers'

test.describe('Board', () => {
  let projectId: string

  test.beforeEach(async ({ page }) => {
    await setupIdentity(page)
    projectId = await createProject(page, 'Board Test Project')

    // Create a stage first via settings
    await page.goto(`/projects/${projectId}/settings`)
    await page.waitForTimeout(500)
    await page.locator('input[placeholder="New stage name…"]').fill('To Do')
    await page.getByRole('button', { name: /^Add$/i }).first().click()
    await page.waitForTimeout(300)
  })

  test('board renders columns for each stage', async ({ page }) => {
    await page.goto(`/projects/${projectId}/board`)
    await page.waitForTimeout(500)
    await expect(page.getByText('To Do')).toBeVisible()
  })

  test('can open add-item modal', async ({ page }) => {
    await page.goto(`/projects/${projectId}/board`)
    // Wait for the stage column to load before clicking Add item
    await expect(page.getByText('To Do')).toBeVisible({ timeout: 8000 })
    await page.getByRole('button', { name: /add item/i }).first().click()
    await expect(page.getByText('New work item')).toBeVisible()
  })

  test('creates a work item and shows it on board', async ({ page }) => {
    await page.goto(`/projects/${projectId}/board`)
    // Wait for stage column
    await expect(page.getByText('To Do')).toBeVisible({ timeout: 8000 })

    // Open add modal
    await page.getByRole('button', { name: /add item/i }).first().click()
    await page.waitForTimeout(200)

    // Fill form
    await page.locator('input[placeholder="What needs to be done?"]').fill('My First Task')
    await page.getByRole('button', { name: /^create$/i }).click()
    await page.waitForTimeout(500)

    await expect(page.getByText('My First Task')).toBeVisible()
  })

  test('add item modal has type, priority, points fields', async ({ page }) => {
    await page.goto(`/projects/${projectId}/board`)
    await expect(page.getByText('To Do')).toBeVisible({ timeout: 8000 })
    await page.getByRole('button', { name: /add item/i }).first().click()

    await expect(page.locator('select').nth(0)).toBeVisible() // type
    await expect(page.locator('select').nth(1)).toBeVisible() // priority
    await expect(page.locator('input[type="number"]')).toBeVisible() // points
  })

  test('creates item with custom type and priority', async ({ page }) => {
    await page.goto(`/projects/${projectId}/board`)
    await expect(page.getByText('To Do')).toBeVisible({ timeout: 8000 })

    await page.getByRole('button', { name: /add item/i }).first().click()
    await page.locator('input[placeholder="What needs to be done?"]').fill('Critical Bug Fix')

    // Set type to Bug
    await page.locator('select').nth(0).selectOption('bug')
    // Set priority to Critical
    await page.locator('select').nth(1).selectOption('critical')
    // Set points
    await page.locator('input[type="number"]').fill('5')

    await page.getByRole('button', { name: /^create$/i }).click()
    await page.waitForTimeout(500)

    await expect(page.getByText('Critical Bug Fix')).toBeVisible()
  })

  test('close modal with Escape key', async ({ page }) => {
    await page.goto(`/projects/${projectId}/board`)
    await expect(page.getByText('To Do')).toBeVisible({ timeout: 8000 })
    await page.getByRole('button', { name: /add item/i }).first().click()
    await expect(page.getByText('New work item')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByText('New work item')).not.toBeVisible()
  })

  test('filters bar can be toggled', async ({ page }) => {
    await page.goto(`/projects/${projectId}/board`)
    await page.waitForTimeout(500)
    await page.getByRole('button', { name: /filters/i }).click()
    // Filter bar should now be visible
    await expect(page.locator('[placeholder*="filter"], select').first()).toBeVisible()
  })
})
