import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import type { Result } from 'axe-core'

// Automated WCAG 2.1 AA scan (G5).
//
// We scan the public auth routes that render standalone against the production
// preview build with NO backend. The gate fails only on `serious`/`critical`
// violations — the impacts that materially block assistive-tech users — while
// `moderate`/`minor` findings are logged for follow-up without breaking CI.
// This keeps the gate meaningful without chasing every low-severity nit.

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
const BLOCKING_IMPACTS = new Set(['serious', 'critical'])

async function scan(page: Page, testInfo: { title: string }) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()

  const blocking: Result[] = []
  const advisory: Result[] = []
  for (const v of results.violations) {
    if (v.impact && BLOCKING_IMPACTS.has(v.impact)) blocking.push(v)
    else advisory.push(v)
  }

  if (advisory.length > 0) {
    // Non-blocking: surface moderate/minor findings for follow-up.
    console.log(
      `[a11y] ${testInfo.title}: ${advisory.length} moderate/minor finding(s): ` +
        advisory.map((v) => `${v.id} (${v.impact})`).join(', '),
    )
  }

  const summary = blocking
    .map((v) => `${v.id} [${v.impact}] ${v.help} (${v.nodes.length} node(s))\n  ${v.helpUrl}`)
    .join('\n')
  expect(blocking, `serious/critical a11y violations:\n${summary}`).toEqual([])
}

test.describe('WCAG 2.1 AA — public auth routes', () => {
  test('/login', async ({ page }, testInfo) => {
    await page.goto('/login')
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    await scan(page, testInfo)
  })

  test('/register', async ({ page }, testInfo) => {
    await page.goto('/register')
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible()
    await scan(page, testInfo)
  })

  test('/forgot-password', async ({ page }, testInfo) => {
    await page.goto('/forgot-password')
    await expect(page.getByRole('button', { name: /send reset instructions/i })).toBeVisible()
    await scan(page, testInfo)
  })

  test('/reset-password (invalid-link state)', async ({ page }, testInfo) => {
    // With no token/backend this renders the standalone "Invalid reset link"
    // card — a real, user-reachable state worth scanning.
    await page.goto('/reset-password')
    await expect(page.getByRole('heading', { name: /invalid reset link/i })).toBeVisible()
    await scan(page, testInfo)
  })

  test('/magic-link (unavailable state)', async ({ page }, testInfo) => {
    // With no token/backend this renders the standalone "Magic link unavailable"
    // card.
    await page.goto('/magic-link')
    await expect(page.getByRole('heading', { name: /magic link unavailable/i })).toBeVisible()
    await scan(page, testInfo)
  })

  // Routes that hard-redirect to /login without an authenticated session (the
  // RouteGuard sends unauthenticated users away). They cannot be scanned in
  // isolation against the backend-less preview, so we skip rather than fake a
  // pass. They are exercised by the live-stack E2E suite under `e2e/`.
  for (const route of ['/recovery', '/account-locked', '/too-many-requests']) {
    test.skip(`${route} (redirects to /login without a session)`, async ({ page }) => {
      await page.goto(route)
    })
  }
})
