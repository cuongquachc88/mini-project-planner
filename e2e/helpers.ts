import { type Page } from '@playwright/test'

/** Wait for PGlite to finish initialising (home or profile page renders). */
export async function waitForApp(page: Page) {
  await page.waitForSelector('body', { state: 'attached' })
  await page.waitForTimeout(2500) // PGlite WASM boot + React hydration
}

/** Set up a fresh identity and return to the home page. */
export async function setupIdentity(page: Page, name = 'Test User', email = 'test@example.com') {
  // Navigate to root and wait for PGlite to boot
  await page.goto('/')
  await waitForApp(page)

  // May be on /profile if no user in DB
  const onProfile = page.url().includes('/profile')
  const profileFormVisible = await page.locator('input[placeholder="Your name"]').isVisible({ timeout: 2000 }).catch(() => false)

  if (onProfile || profileFormVisible) {
    await page.locator('input[placeholder="Your name"]').waitFor({ state: 'visible', timeout: 5000 })
    await page.locator('input[placeholder="Your name"]').fill(name)
    await page.locator('input[placeholder="you@example.com"]').fill(email)
    await page.getByRole('button', { name: /get started/i }).click()
    // Wait for navigation to home
    await page.waitForURL('/', { timeout: 10000 })
    await page.waitForTimeout(1500) // let DB writes settle before next navigations
  }

  // Confirm we are on the home page (header always present on Home)
  await page.waitForSelector('header', { state: 'visible', timeout: 8000 })
}

/** Create a project and navigate into it, returning the projectId from URL. */
export async function createProject(page: Page, name = 'Test Project') {
  await page.goto('/')
  await waitForApp(page)

  // Wait for Home page header to appear
  await page.waitForSelector('header', { state: 'visible', timeout: 8000 })

  // Click "New" button (in header) or "Create project" (empty state)
  const newBtn = page.getByRole('button', { name: 'New' })
  const createBtn = page.getByRole('button', { name: 'Create project' })

  if (await newBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await newBtn.click()
  } else {
    await createBtn.click()
  }

  // Fill in the modal
  await page.locator('input[placeholder="My project"]').waitFor({ state: 'visible', timeout: 5000 })
  await page.locator('input[placeholder="My project"]').fill(name)
  // Click "Create project" button inside the modal (last one if multiple)
  await page.getByRole('button', { name: 'Create project' }).last().click()

  // Should redirect to project board
  await page.waitForURL(/\/projects\/.+\/board/, { timeout: 10000 })
  const url = page.url()
  const match = url.match(/\/projects\/([^/]+)/)
  return match?.[1] ?? ''
}

/** Navigate to a project board by ID. */
export async function gotoBoard(page: Page, projectId: string) {
  await page.goto(`/projects/${projectId}/board`)
  await page.waitForURL(`/projects/${projectId}/board`)
}
