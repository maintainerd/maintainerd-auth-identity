# End-to-End Tests (Playwright)

Cross-repo E2E smoke for the hosted identity app, exercising core journeys against a **live stack** (backend `:8081` + this app, via the local nginx hosts). These are intentionally **not installed as a project dependency** (to keep `npm ci`/`vite build` lean); Playwright is installed on demand for E2E runs.

## Run locally

```bash
# From the identity repo root, with the stack up (docker compose in maintainerd-dev):
npm i -D @playwright/test
npx playwright install --with-deps
E2E_CLIENT_ID=<seeded-public-client-id> \
  npx playwright test -c e2e/playwright.config.ts
```

## CI wiring

Add a job that (1) brings up the full stack (`maintainerd-dev` compose: backend + Postgres + Redis + this app), (2) installs Playwright, (3) runs the suite against the stack. Because it needs the whole stack, run it on a schedule or a `e2e` label rather than every PR:

```yaml
# .github/workflows/e2e.yml (template)
name: E2E
on:
  workflow_dispatch:
  schedule: [{ cron: '0 6 * * *' }]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # bring up the maintainerd-dev stack here (compose up --wait)
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm ci
      - run: npm i -D @playwright/test && npx playwright install --with-deps
      - run: E2E_CLIENT_ID=${{ secrets.E2E_CLIENT_ID }} npx playwright test -c e2e/playwright.config.ts
```

## Coverage

`auth.smoke.spec.ts` covers: login page renders, `screen_hint=signup` → registration, invalid credentials show an error (no crash), and repeated failures route to the lockout/rate-limit screen (validates the D5 wiring). Extend with OAuth `authorize → code → token`, MFA enroll+login, and password reset as the suite grows.
