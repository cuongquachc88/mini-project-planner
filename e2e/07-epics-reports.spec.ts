import { test, expect } from '@playwright/test'
import { setupIdentity, createProject } from './helpers'

test.describe('Epics & Milestones', () => {
  let projectId: string

  test.beforeEach(async ({ page }) => {
    await setupIdentity(page)
    projectId = await createProject(page, 'Epics Test Project')
  })

  test('epics page loads with tab switcher', async ({ page }) => {
    await page.goto(`/projects/${projectId}/epics`)
    await page.waitForTimeout(500)
    // Use exact match to avoid matching the project switcher button that also contains "epics"
    await expect(page.getByRole('button', { name: 'epics', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'milestones', exact: true })).toBeVisible()
  })

  test('can create an epic', async ({ page }) => {
    await page.goto(`/projects/${projectId}/epics`)
    await page.waitForTimeout(500)
    await page.getByRole('button', { name: /new epic/i }).click()
    await page.locator('input[placeholder="Epic title"]').fill('Auth System')
    await page.getByRole('button', { name: /^create$/i }).click()
    await page.waitForTimeout(500)
    await expect(page.getByText('Auth System')).toBeVisible()
  })

  test('can switch to milestones tab', async ({ page }) => {
    await page.goto(`/projects/${projectId}/epics`)
    await page.waitForTimeout(500)
    await page.getByRole('button', { name: 'milestones', exact: true }).click()
    await expect(page.getByRole('button', { name: /new milestone/i })).toBeVisible()
  })

  test('can create a milestone', async ({ page }) => {
    await page.goto(`/projects/${projectId}/epics`)
    await page.waitForTimeout(500)
    await page.getByRole('button', { name: 'milestones', exact: true }).click()
    await page.getByRole('button', { name: /new milestone/i }).click()
    await page.locator('input[placeholder="Milestone title"]').fill('v1.0 Launch')
    await page.getByRole('button', { name: /^create$/i }).click()
    await page.waitForTimeout(500)
    await expect(page.getByText('v1.0 Launch')).toBeVisible()
  })
})

test.describe('Reports', () => {
  let projectId: string

  test.beforeEach(async ({ page }) => {
    await setupIdentity(page)
    projectId = await createProject(page, 'Reports Test Project')
  })

  test('reports page loads with empty state', async ({ page }) => {
    await page.goto(`/projects/${projectId}/reports`)
    await page.waitForTimeout(500)
    await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible()
    await expect(page.getByText(/complete a sprint/i)).toBeVisible()
  })

  test('velocity stat shows 0 with no sprints', async ({ page }) => {
    await page.goto(`/projects/${projectId}/reports`)
    await page.waitForTimeout(500)
    await expect(page.getByText('3-sprint velocity')).toBeVisible()
    await expect(page.getByText('0 pts')).toBeVisible()
  })
})
