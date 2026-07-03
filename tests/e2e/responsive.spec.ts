import { expect, test } from '@playwright/test'

// K1 — responsive viewport checks.
//
// For each backend-less public route we render at three representative
// viewports (mobile / tablet / desktop) and assert the layout holds up:
//   1. no horizontal overflow (the page never scrolls sideways),
//   2. the primary heading and the primary submit control are visible, and
//   3. on mobile the submit control is a usable tap target.
//
// Assertions use small tolerances so they catch real breakage (a wide element
// forcing a horizontal scrollbar) without being pixel-brittle.

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
] as const

// The design system's default button is `h-9` (36px). WCAG 2.5.5 targets a
// larger touch target (~40–44px); we assert a robust floor here so the check
// flags a genuinely collapsed control rather than a few sub-pixel rows.
const MIN_TAP_TARGET_PX = 34

interface RouteCase {
  path: string
  heading: RegExp
  submit: RegExp
}

const ROUTES: RouteCase[] = [
  { path: '/login', heading: /welcome back/i, submit: /^sign in$/i },
  { path: '/register', heading: /create your account/i, submit: /create account/i },
  { path: '/forgot-password', heading: /forgot your password/i, submit: /send reset instructions/i },
]

test.describe('K1 — responsive layout (public auth routes)', () => {
  for (const route of ROUTES) {
    for (const vp of VIEWPORTS) {
      test(`${route.path} @ ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height })
        await page.goto(route.path)

        const heading = page.getByRole('heading', { name: route.heading })
        await expect(heading).toBeVisible()

        const submit = page.getByRole('button', { name: route.submit })
        await expect(submit).toBeVisible()

        // No horizontal overflow: the document must not be wider than the
        // viewport. +1 absorbs sub-pixel rounding.
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        )
        expect(overflow).toBeLessThanOrEqual(1)

        // On mobile the primary control must remain a usable tap target.
        if (vp.name === 'mobile') {
          const box = await submit.boundingBox()
          expect(box).not.toBeNull()
          expect(box!.height).toBeGreaterThanOrEqual(MIN_TAP_TARGET_PX)
        }
      })
    }
  }
})
