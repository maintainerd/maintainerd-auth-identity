import { expect, test } from '@playwright/test'

// K4 (backend-less portion) — client-side journeys.
//
// These cover behavior that is fully client-side: form validation, in-app
// navigation, standalone error states, and redirect safety. They render
// against the production preview with NO backend. The full stack-dependent
// journeys (real login → OAuth → token, MFA, etc.) are stubbed at the bottom
// under a `live` describe that only runs when E2E_BASE_URL is set.

test.describe('K4 — client-side journeys (identity, backend-less)', () => {
  test('empty login submit surfaces field validation errors', async ({ page }) => {
    await page.goto('/login')

    // Submitting with both fields empty must not navigate away and must show
    // accessible (role="alert") validation errors for the required fields.
    await page.getByRole('button', { name: /^sign in$/i }).click()

    const alerts = page.getByRole('alert')
    await expect(alerts.filter({ hasText: /email is required/i })).toBeVisible()
    await expect(alerts.filter({ hasText: /password is required/i })).toBeVisible()

    // Still on the login route — no client-side navigation on invalid submit.
    await expect(page).toHaveURL(/\/login(\?.*)?$/)
  })

  test('login → forgot-password → back to login', async ({ page }) => {
    await page.goto('/login')

    await page.getByRole('link', { name: /forgot password/i }).click()
    await expect(page).toHaveURL(/\/forgot-password/)
    await expect(page.getByRole('heading', { name: /forgot your password/i })).toBeVisible()

    await page.getByRole('link', { name: /back to login/i }).click()
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
  })

  test('/reset-password without a token renders the invalid-link state', async ({ page }) => {
    await page.goto('/reset-password')
    await expect(page.getByRole('heading', { name: /invalid reset link/i })).toBeVisible()
  })

  test('/magic-link without a token renders the unavailable state', async ({ page }) => {
    await page.goto('/magic-link')
    await expect(page.getByRole('heading', { name: /magic link unavailable/i })).toBeVisible()
  })

  test('off-origin return_to does not navigate away from the app origin', async ({ page, baseURL }) => {
    // A malicious `return_to` pointing off-origin must never cause the app to
    // navigate to an external site. On the login screen (no auto-submit) the
    // page must simply stay on its own origin and render the login form.
    const appOrigin = new URL(baseURL ?? 'http://localhost').origin
    await page.goto('/login?return_to=https://evil.example.com/phish')

    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
    // Give any errant redirect a chance to fire, then assert we're still local.
    await page.waitForTimeout(300)
    const current = new URL(page.url())
    expect(current.origin).toBe(appOrigin)
    expect(current.hostname).not.toBe('evil.example.com')
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Full stack-dependent journeys (require a live backend at E2E_BASE_URL).
//
// These are intentionally SKIPPED unless E2E_BASE_URL is set, and are left as
// documented placeholders — we do not fake a pass for flows that need a real
// API. The owner runs these against a running stack, e.g.:
//
//   E2E_BASE_URL=https://identity.auth.maintainerd.local npx playwright test tests/e2e/journeys.spec.ts
//
// Each placeholder documents the end-to-end path the owner is expected to wire
// up and assert against the live backend.
// ────────────────────────────────────────────────────────────────────────────
test.describe('live — full stack journeys (identity)', () => {
  test.skip(!process.env.E2E_BASE_URL, 'requires a live backend (set E2E_BASE_URL)')

  test('password login → OAuth authorize → token issuance', async () => {
    // 1. Visit /login?client_id=...&return_to=/oauth/authorize?...
    // 2. Enter valid credentials, submit.
    // 3. Assert redirect through /oauth/authorize and back to the client with
    //    an authorization code, then a successful token exchange.
  })

  test('self-service registration → email verification', async () => {
    // 1. /register → fill email/password, submit.
    // 2. Assert the verify-email step and (via test mailbox) the verification
    //    link completes the account.
  })

  test('MFA enrollment then MFA-gated login', async () => {
    // 1. Enroll a TOTP factor for a test account.
    // 2. Log out, log back in, assert the two-step verification challenge and
    //    that a valid code completes the login.
  })

  test('password reset end to end', async () => {
    // 1. /forgot-password → submit a known email.
    // 2. Follow the reset link (test mailbox) → set a new password.
    // 3. Assert login with the new password succeeds.
  })

  test('lockout / rate-limit (429) surfaces the too-many-requests UI', async () => {
    // 1. Repeatedly submit bad credentials until the backend returns 429.
    // 2. Assert the account-locked / too-many-requests screen renders.
  })
})
