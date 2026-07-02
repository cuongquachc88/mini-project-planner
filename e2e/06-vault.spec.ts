import { test, expect } from '@playwright/test'
import { setupIdentity, createProject } from './helpers'

test.describe('Vault', () => {
  let projectId: string

  test.beforeEach(async ({ page }) => {
    await setupIdentity(page)
    projectId = await createProject(page, 'Vault Test Project')
  })

  test('meeting notes page loads', async ({ page }) => {
    await page.goto(`/projects/${projectId}/vault/notes`)
    await page.waitForTimeout(500)
    await expect(page.getByRole('heading', { name: 'Meeting Notes' })).toBeVisible()
  })

  test('can create a meeting note', async ({ page }) => {
    await page.goto(`/projects/${projectId}/vault/notes`)
    await page.waitForTimeout(500)
    await page.getByRole('button', { name: /new note/i }).click()
    await page.locator('input[placeholder="Meeting title"]').fill('Sprint Planning')
    await page.getByRole('button', { name: /^save$/i }).click()
    await page.waitForTimeout(600)
    await expect(page.getByRole('heading', { name: 'Sprint Planning' })).toBeVisible()
  })

  test('can create a decision', async ({ page }) => {
    await page.goto(`/projects/${projectId}/vault/decisions`)
    await page.waitForTimeout(500)
    await page.getByRole('button', { name: /new decision/i }).click()
    await page.locator('input[placeholder="Decision title"]').fill('Use PGlite')
    await page.locator('textarea').first().fill('We decided to use PGlite for offline storage')
    await page.getByRole('button', { name: /^save$/i }).click()
    await page.waitForTimeout(600)
    await expect(page.getByRole('heading', { name: 'Use PGlite' })).toBeVisible()
  })

  test('can create a retrospective', async ({ page }) => {
    await page.goto(`/projects/${projectId}/vault/retros`)
    await page.waitForTimeout(500)
    await page.getByRole('button', { name: /new retro/i }).click()
    await page.locator('textarea').first().fill('Shipped on time')
    await page.getByRole('button', { name: /^save$/i }).click()
    await page.waitForTimeout(600)
    // Retro appears in list — look for the card container
    await expect(page.locator('textarea').first()).not.toBeVisible()
  })

  test('can create a run sheet', async ({ page }) => {
    await page.goto(`/projects/${projectId}/vault/runsheets`)
    await page.waitForTimeout(500)
    await page.getByRole('button', { name: /new run sheet/i }).click()
    await page.locator('input[placeholder="Run sheet title"]').fill('Deploy Checklist')
    await page.getByRole('button', { name: /^create$/i }).click()
    await page.waitForTimeout(600)
    await expect(page.getByText('Deploy Checklist')).toBeVisible()
  })

  test('can add item to run sheet', async ({ page }) => {
    await page.goto(`/projects/${projectId}/vault/runsheets`)
    await page.waitForTimeout(500)
    await page.getByRole('button', { name: /new run sheet/i }).click()
    await page.locator('input[placeholder="Run sheet title"]').fill('My Checklist')
    await page.getByRole('button', { name: /^create$/i }).click()
    await page.waitForTimeout(600)

    await page.locator('input[placeholder="Add step…"]').fill('Run tests')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(400)
    await expect(page.getByText('Run tests')).toBeVisible()
  })

  test('can track a cost', async ({ page }) => {
    await page.goto(`/projects/${projectId}/vault/costs`)
    await page.waitForTimeout(500)
    await page.getByRole('button', { name: /add cost/i }).click()
    await page.locator('input[placeholder="Vercel, GitHub, etc."]').fill('Vercel')
    await page.locator('input[type="number"]').first().fill('20')
    await page.getByRole('button', { name: /^save$/i }).click()
    await page.waitForTimeout(600)
    await expect(page.getByText('Vercel')).toBeVisible()
    // Cost row shows the individual amount; strict: use exact text in a p element
    await expect(page.locator('p').filter({ hasText: /^\$20\.00$/ }).first()).toBeVisible()
  })

  test('wiki page loads and can create a page', async ({ page }) => {
    await page.goto(`/projects/${projectId}/vault/wiki`)
    await page.waitForTimeout(500)
    // Click the add page button
    await page.getByRole('button', { name: /new page/i }).first().click()
    await page.locator('input[placeholder="Page title"]').fill('Architecture')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(600)
    await expect(page.getByRole('heading', { name: 'Architecture' })).toBeVisible()
  })
})
