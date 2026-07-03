# Performance — bundle budget & Lighthouse

This app is a React 19 + Vite SPA. Route components are lazily loaded
(route-based code-splitting, F4), so only the shell + the visited route's chunk
load on first paint. Vendor code is split into a dedicated `react-vendor` chunk
so it caches independently of app code.

## Bundle budget

**Budget: no single emitted chunk may exceed 500 KB raw (uncompressed).**

This matches Vite's default `chunkSizeWarningLimit` (500 KB). A build that emits
a chunk larger than 500 KB is a signal that a heavy dependency needs its own
manual chunk or a route needs further splitting. The 500 KB ceiling is on the
raw byte size; gzipped transfer sizes are far smaller (see below).

## Current measured chunk sizes

Measured from `npm run build` (production, no source maps). Largest chunks:

| Chunk | Raw | Gzip |
|-------|-----|------|
| `index-*.js` (app entry) | 421.8 KB | 140.1 KB |
| `index.esm-*.js` (vendor) | 118.6 KB | 42.3 KB |
| `index-*.css` (styles) | 66.1 KB | — |
| `react-vendor-*.js` | 48.1 KB | 17.5 KB |

All other chunks are lazily-loaded route/component chunks under 10 KB each.

**No chunk exceeds 500 KB raw** — the largest is the app entry at ~422 KB raw
(~140 KB gzip). Budget is met.

## Lighthouse CI

`npm run lighthouse` runs Lighthouse CI (`lhci autorun`) against the production
preview build serving `/login` with **no backend** (the public auth pages render
standalone). Config: `lighthouserc.json`.

Assertion gates:

- **Accessibility ≥ 0.90 — hard error** (blocks CI). The axe work (G5) keeps
  these pages clean.
- **Performance ≥ 0.80 — warn only** (does not block; scores vary in CI).
- **Best-practices ≥ 0.90 — warn only.**

Reports are written to `.lighthouseci/` (git-ignored).
