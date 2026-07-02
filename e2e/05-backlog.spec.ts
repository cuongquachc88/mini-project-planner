import { test, expect } from '@playwright/test'
import { setupIdentity, createProject } from './helpers'

test.describe('Backlog & Sprints', () => {
  let projectId: string

  test.beforeEach(async ({ page }) => {
    await setupIdentity(page)
    projectId = await createProject(page, 'Backlog Test Project')

    // Ensure a stage exists
    await page.goto(`/projects/${projectId}/settings`)
    await page.waitForTimeout(400)
    await page.locator('input[placeholder="New stage name…"]').fill('To Do')
    await page.getByRole('button', { name: /^Add$/i }).first().click()
    await page.waitForTimeout(300)
  })

  test('backlog page loads', async ({ page }) => {
    await page.goto(`/projects/${projectId}/backlog`)
    await page.waitForTimeout(500)
    await expect(page.getByText('Backlog')).toBeVisible()
  })

  test('can add item to backlog', async ({ page }) => {
    await page.goto(`/projects/${projectId}/backlog`)
    await page.waitForTimeout(500)
    await page.getByText(/add item to backlog/i).click()
    await page.locator('input[placeholder="New backlog item title"]').fill('Backlog Story')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(400)
    await expect(page.getByText('Backlog Story')).toBeVisible()
  })

  test('can create a sprint', async ({ page }) => {
    await page.goto(`/projects/${projectId}/backlog`)
    await page.waitForTimeout(500)
    await page.getByRole('button', { name: /new sprint/i }).click()
    await page.locator('input[placeholder="Sprint name"]').fill('Sprint 1')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(400)
    await expect(page.getByText('Sprint 1')).toBeVisible()
  })

  test('can start a sprint', async ({ page }) => {
    await page.goto(`/projects/${projectId}/backlog`)
    await page.waitForTimeout(500)

    // Create sprint
    await page.getByRole('button', { name: /new sprint/i }).click()
    await page.locator('input[placeholder="Sprint name"]').fill('Sprint Alpha')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(400)

    // Start sprint
    await page.getByRole('button', { name: /start sprint/i }).click()

    // Sprint should now show as active — wait for useLiveQuery to update
    await expect(page.locator('text=Active')).toBeVisible({ timeout: 5000 })
  })
})
