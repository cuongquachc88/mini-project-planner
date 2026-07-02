import { test, expect } from '@playwright/test'
import { setupIdentity, waitForApp } from './helpers'

test.describe('Projects', () => {
  test.beforeEach(async ({ page }) => {
    await setupIdentity(page)
  })

  test('home page shows project list area', async ({ page }) => {
    await page.goto('/')
    await waitForApp(page)
    // Should show "New" button in header or "Create project" in empty state
    const hasNew = await page.locator('header').getByRole('button', { name: /^new$/i }).isVisible({ timeout: 2000 }).catch(() => false)
    const hasCreate = await page.getByRole('button', { name: /create project/i }).isVisible({ timeout: 2000 }).catch(() => false)
    expect(hasNew || hasCreate).toBeTruthy()
  })

  test('creates a new project and navigates to board', async ({ page }) => {
    await page.goto('/')
    await waitForApp(page)
    // Click New button in header (always present)
    await page.locator('header').getByRole('button', { name: /^new$/i }).click()

    const projectNameInput = page.locator('input[placeholder="My project"]').first()
    await projectNameInput.waitFor({ state: 'visible' })
    await projectNameInput.fill('My E2E Project')
    await page.getByRole('button', { name: /create project/i }).last().click()

    await page.waitForURL(/\/projects\/.+\/board/)
    await expect(page).toHaveURL(/\/projects\/.+\/board/)
  })

  test('project appears on home after creation', async ({ page }) => {
    await page.goto('/')
    await waitForApp(page)

    // Create project
    await page.locator('header').getByRole('button', { name: /^new$/i }).click()
    const input = page.locator('input[placeholder="My project"]').first()
    await input.waitFor({ state: 'visible' })
    await input.fill('Visible Project')
    await page.getByRole('button', { name: /create project/i }).last().click()
    await page.waitForURL(/\/projects\/.+\/board/)

    // Go home
    await page.goto('/')
    await waitForApp(page)
    await expect(page.getByText('Visible Project')).toBeVisible()
  })
})
