# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Create React App (react-scripts 5) + TypeScript 4.9 + React 18 + React Router v6 + Tailwind CSS. Package manager: npm. This is **not** Vite or Next.js — there is no SSR; all routing is client-side.

## Commands

- `npm start` — dev server
- `npm run build` — production build to `build/`; its `postbuild` step auto-runs `scripts/generate-sitemap.js` to emit `build/sitemap.xml` and `build/robots.txt`
- `npm run generate:sitemap` — run the sitemap/robots generator standalone
- `npm test` — Jest (watch mode by default; use `CI=true npm test` to run once, `npm test -- -t "name"` for a single test)
- `npm run format` — Prettier write across `src/`; `npm run format:check` to verify without writing

## Environment

Requires a local `.env` (gitignored) with:
- `REACT_APP_API_BASE_URL` — backend API endpoint, read across components
- `REACT_APP_SITE_PASSWORD` — optional site-access password
- `SITE_URL` (or `REACT_APP_SITE_URL`) — base URL for sitemap generation; defaults to `https://yourdomain.com` if unset

## Conventions & gotchas

- **Routes** are lazy-loaded in `src/App.tsx` via `React.lazy` + `Suspense`. When adding a public route, also add its path to the `routes` array in `scripts/generate-sitemap.js` (lines ~8-15) or it won't appear in the sitemap.
- **SEO**: per-page `<title>`/meta use `react-helmet-async`; `HelmetProvider` wraps the app in `src/index.tsx`.
- Shared TypeScript interfaces live in `src/types.ts`.
- Auth is a **DRF token** in `localStorage` under `token`, sent as `Authorization: Token <key>` (not a JWT, despite the name). Activation happens via the `/activate/:token` route.
- **Credits**: never read the `credits` value stashed in `localStorage` at login -- it's a snapshot that goes stale the moment the user generates an image or buys a pack. Use the `useAccount()` hook (`src/useAccount.ts`), which reads `GET /api/me/`, and call its `refresh()` after anything that moves credits.
- **Billing**: `/billing` renders the catalog from `GET /api/billing/products/` -- prices and product keys live in the backend's `billing/products.py` and must not be hardcoded here. The client only ever POSTs a `product_key`; the amount charged is resolved server-side. `/billing/success` and `/billing/cancel` are where Stripe returns the browser; they are `noindex` and deliberately excluded from the sitemap.
- **The webhook race**: Stripe redirects to `/billing/success` the moment the card clears, but credits are granted by a backend webhook a beat later. `BillingSuccess` polls `GET /api/billing/checkout-status/` until `fulfilled` rather than reading the balance once -- a single read will sometimes show the pre-purchase number and look like a failure.
- The GA4 measurement ID is hardcoded in `src/App.tsx`.
- Formatting is Prettier (`.prettierrc.json`): single quotes, semicolons, 2-space indent, 100-col, `trailingComma: es5`. `prettier-plugin-tailwindcss` auto-sorts Tailwind classes, so don't hand-order `className` strings. Correctness linting is CRA's built-in `react-app` ESLint, with `eslint-config-prettier` disabling formatting rules that conflict.

## Git workflow

Branch off `main` for features and open a PR for review before merging — don't commit directly to `main`.
