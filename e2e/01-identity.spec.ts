import { test, expect } from '@playwright/test'
import { waitForApp } from './helpers'

test.describe('Identity / Profile', () => {
  test('shows profile setup on first visit', async ({ page }) => {
    await page.goto('/')
    await waitForApp(page)
    await expect(page.locator('input[placeholder="Your name"]')).toBeVisible()
  })

  test('creates user and lands on home', async ({ page }) => {
    await page.goto('/')
    await waitForApp(page)
    const nameInput = page.locator('input[placeholder="Your name"]')
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.fill('Alice')
      await page.locator('input[type="email"]').fill('alice@test.com')
      await page.getByRole('button', { name: /get started/i }).click()
      await page.waitForURL('/')
    }
    await expect(page).toHaveURL('/')
  })

  test('profile page saves name and persists after reload', async ({ page }) => {
    await page.goto('/')
    await waitForApp(page)

    // Set up if needed
    const nameInput = page.locator('input[placeholder="Your name"]')
    if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nameInput.fill('Bob')
      await page.locator('input[type="email"]').fill('bob@test.com')
      await page.getByRole('button', { name: /get started/i }).click()
      await page.waitForURL('/')
    }

    // Go to profile and update name
    await page.goto('/profile')
    await page.waitForTimeout(500)
    const profileName = page.locator('input[placeholder="Your name"]')
    await profileName.clear()
    await profileName.fill('Bob Updated')
    await page.getByRole('button', { name: /save changes/i }).click()
    await page.waitForTimeout(500)

    // Reload and verify name persisted
    await page.reload()
    await page.waitForTimeout(1000)
    await page.goto('/profile')
    await page.waitForTimeout(500)
    await expect(page.locator('input[placeholder="Your name"]')).toHaveValue('Bob Updated')
  })
})
