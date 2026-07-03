# Accessibility

## Target

The Maintainerd Auth Identity app targets **WCAG 2.1 Level AA**. Because this is
the public, end-user-facing surface (login, registration, MFA, recovery), the
authentication screens are treated as the highest-priority path for conformance.

## Measures in place

- **Announced errors** — form and auth errors are rendered in `role="alert"` /
  `aria-live` regions (e.g. `LoginForm`, `RegisterForm`, `RegisterInviteForm`,
  `VerifyEmailPage`, `MagicLinkPage`, `OAuthAuthorizePage`), so assistive tech
  announces failures without a focus change.
- **Selected-state semantics** — the MFA method picker (`LoginMFAStep`) exposes
  `aria-pressed` on its option buttons.
- **Labels & keyboard reachability** — inputs are associated with visible labels;
  interactive controls are reachable and operable by keyboard.
- **Responsive** — a `viewport` meta tag is set and layouts use responsive
  breakpoints down to mobile widths (see [`checklist.md`](checklist.md) K1).
- **No color-only signaling** — status is conveyed with text/icons in addition to
  color.

## Automated verification

An automated axe (`@axe-core/playwright`) scan runs as part of CI (the `a11y`
job in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)) and locally:

```bash
npm run build          # produce dist/
npm run a11y           # axe scan against the production preview (no backend)
```

The scan (`tests/e2e/a11y.spec.ts`, driven by [`playwright.config.ts`](../playwright.config.ts))
loads the **production preview** build with **no backend running** and asserts
`withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa'])`. It **fails on any
`serious`/`critical` violation** and logs `moderate`/`minor` findings as
advisory output without failing — keeping the gate meaningful without chasing
every low-severity nit.

**Routes scanned** (they render standalone without an API):

- `/login`, `/register`, `/forgot-password` — the primary interactive forms
- `/reset-password` — the "Invalid reset link" state (no token/backend)
- `/magic-link` — the "Magic link unavailable" state (no token/backend)

As of the current run, all scanned routes report **zero** violations at any
impact level.

This is separate from the cross-repo live-stack Playwright E2E suite under
[`e2e/`](../e2e), which exercises full journeys against a running backend.

## Known exceptions / gaps

- **Session-gated routes are not scanned by the automated gate.** `/recovery`,
  `/account-locked`, and `/too-many-requests` hard-redirect to `/login` for an
  unauthenticated visitor (the `RouteGuard` sends them away), so they cannot be
  rendered in isolation against the backend-less preview. They are `test.skip`ped
  with an explanatory comment in `tests/e2e/a11y.spec.ts` rather than faked, and
  are covered by the live-stack E2E suite. Authenticated routes (MFA step,
  `/account/*`) likewise require a session and are out of the preview gate's scope.
- Third-party WebAuthn browser prompts are outside the app's control.

Report accessibility issues via the process in [`../SECURITY.md`](../SECURITY.md)
or the repository issue tracker.
