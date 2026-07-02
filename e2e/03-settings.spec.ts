import { test, expect } from '@playwright/test'
import { setupIdentity, createProject } from './helpers'

test.describe('Settings — Stages & Labels', () => {
  let projectId: string

  test.beforeEach(async ({ page }) => {
    await setupIdentity(page)
    projectId = await createProject(page, 'Settings Test Project')
  })

  test('can create a board stage', async ({ page }) => {
    await page.goto(`/projects/${projectId}/settings`)
    await page.waitForTimeout(500)

    await page.locator('input[placeholder="New stage name…"]').fill('In Progress')
    await page.getByRole('button', { name: /^Add$/i }).first().click()

    await expect(page.getByText('In Progress')).toBeVisible()
  })

  test('can mark a stage as done', async ({ page }) => {
    await page.goto(`/projects/${projectId}/settings`)
    await page.waitForTimeout(500)

    // Create stage first
    await page.locator('input[placeholder="New stage name…"]').fill('Done Stage')
    await page.getByRole('button', { name: /^Add$/i }).first().click()
    await page.waitForTimeout(300)

    await page.getByRole('button', { name: /mark done/i }).first().click()
    await expect(page.getByText('✓ Done')).toBeVisible()
  })

  test('can delete a stage', async ({ page }) => {
    await page.goto(`/projects/${projectId}/settings`)
    await page.waitForTimeout(500)

    await page.locator('input[placeholder="New stage name…"]').fill('Temp Stage')
    await page.getByRole('button', { name: /^Add$/i }).first().click()
    await page.waitForTimeout(400)

    // Find the stage row using Playwright's filter to locate a flex row containing "Temp Stage"
    const stageRows = page.locator('.flex.items-center.gap-3.px-3')
    const stageRow = stageRows.filter({ hasText: 'Temp Stage' }).first()
    await expect(stageRow).toBeVisible({ timeout: 5000 })
    await stageRow.hover()
    await page.waitForTimeout(300)

    page.once('dialog', d => d.accept())
    // Delete button is the last button in the stage row (after "Mark done")
    await stageRow.locator('button').last().click()
    await page.waitForTimeout(500)

    await expect(page.getByText('Temp Stage')).not.toBeVisible()
  })

  test('can create a label', async ({ page }) => {
    await page.goto(`/projects/${projectId}/settings`)
    await page.waitForTimeout(500)

    await page.locator('input[placeholder="New label name…"]').fill('bug')
    await page.getByRole('button', { name: /^Add$/i }).last().click()

    await expect(page.getByText('bug')).toBeVisible()
  })

  test('can rename project', async ({ page }) => {
    await page.goto(`/projects/${projectId}/settings`)
    await page.waitForTimeout(500)

    const nameInput = page.locator('input[placeholder="Project name"]')
    await nameInput.clear()
    await nameInput.fill('Renamed Project')
    await page.getByRole('button', { name: /save/i }).first().click()
    await page.waitForTimeout(500)

    // Navigate away and back
    await page.goto(`/projects/${projectId}/settings`)
    await page.waitForTimeout(500)
    await expect(page.locator('input[placeholder="Project name"]')).toHaveValue('Renamed Project')
  })
})
