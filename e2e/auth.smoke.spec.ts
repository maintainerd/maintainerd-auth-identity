import { expect, test } from '@playwright/test';

// Core-journey smoke E2E for the hosted identity app. These run against a live
// stack (see e2e/README.md). CLIENT_ID must be a seeded public client.
const CLIENT_ID = process.env.E2E_CLIENT_ID || '';

test.describe('hosted identity — core journeys', () => {
  test('login page renders for a valid client', async ({ page }) => {
    test.skip(!CLIENT_ID, 'set E2E_CLIENT_ID');
    await page.goto(`/login?client_id=${CLIENT_ID}`);
    await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('screen_hint=signup lands on registration', async ({ page }) => {
    test.skip(!CLIENT_ID, 'set E2E_CLIENT_ID');
    await page.goto(`/oauth/authorize?client_id=${CLIENT_ID}&screen_hint=signup&response_type=code&redirect_uri=https://example.com/cb&state=x&code_challenge=x&code_challenge_method=S256`);
    // App forwards signup intent to the registration screen.
    await expect(page).toHaveURL(/register/);
  });

  test('invalid credentials show an error, not a crash', async ({ page }) => {
    test.skip(!CLIENT_ID, 'set E2E_CLIENT_ID');
    await page.goto(`/login?client_id=${CLIENT_ID}`);
    await page.getByLabel(/email|username/i).fill('nobody@example.com');
    await page.getByLabel(/password/i).fill('wrong-password-123');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('too many attempts routes to the rate-limit screen', async ({ page }) => {
    test.skip(!CLIENT_ID, 'set E2E_CLIENT_ID');
    await page.goto(`/login?client_id=${CLIENT_ID}`);
    for (let i = 0; i < 12; i++) {
      await page.getByLabel(/email|username/i).fill('nobody@example.com');
      await page.getByLabel(/password/i).fill('wrong-password-123');
      await page.getByRole('button', { name: /sign in|log in/i }).click();
      await page.waitForTimeout(150);
    }
    // D5: 429/lockout navigates to the dedicated screen.
    await expect(page).toHaveURL(/too-many-requests|account-locked/);
  });
});
