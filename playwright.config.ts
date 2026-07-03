import { defineConfig, devices } from '@playwright/test'

// Accessibility (WCAG 2.1 AA) config — G5.
//
// This runs @axe-core/playwright against the *production preview* build with no
// backend running. The public auth routes (login / register / recovery error
// states) render standalone, so we can assert on their accessibility without a
// live API. Cross-repo live-stack E2E lives separately under `e2e/`.
const PORT = 5174
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
  },
  // K2 — cross-browser coverage. webkit is Safari's engine and chromium also
  // covers Edge (both Chromium-based), so these three projects exercise the
  // automatable core of Chrome/Edge/Firefox/Safari. Every spec under tests/e2e
  // (a11y, responsive, journeys) runs on all three.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  // Serve the built app without a backend. `npm run preview` serves `dist/`, so
  // the caller must have run `npm run build` first (the CI a11y job does).
  webServer: {
    command: `npm run preview -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
