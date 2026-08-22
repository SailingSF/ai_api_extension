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
- **Billing and credits** have their own section below — read it before touching anything that displays a balance.
- The GA4 measurement ID is hardcoded in `src/App.tsx`.
- Formatting is Prettier (`.prettierrc.json`): single quotes, semicolons, 2-space indent, 100-col, `trailingComma: es5`. `prettier-plugin-tailwindcss` auto-sorts Tailwind classes, so don't hand-order `className` strings. Correctness linting is CRA's built-in `react-app` ESLint, with `eslint-config-prettier` disabling formatting rules that conflict.

## Billing and credits

The backend sells credits through Stripe Checkout (hosted redirect). This app never
renders a card form and never sees card details — it hands off to Stripe and reads
the result back over the API.

### Never trust the localStorage balance

`AuthModal` stashes a `credits` value in `localStorage` at login. It is a **snapshot**
and goes stale the moment the user generates an image or buys a pack.

Use `useAccount()` (`src/useAccount.ts`), which reads `GET /api/me/`, and call its
`refresh()` after anything that moves credits — a generation, a purchase. It keeps
the `localStorage` copy in step for older code still reading it, and treats a 401 as
signed-out rather than leaving a stale number on screen.

### Two buckets, different lifetimes

`GET /api/me/` returns `credits` (the spendable total) plus the two buckets behind
it. They are not interchangeable and the UI should not merge them silently:

- `monthly_credits` — subscription allowance, **resets** each billing period
- `purchased_credits` — from packs and the signup bonus, **never expires**

Spending drains the monthly bucket first.

### Routes

| Route | In sitemap | Notes |
|---|---|---|
| `/billing` | yes | catalog + balance; public, doubles as the pricing page |
| `/billing/success` | **no** | where Stripe returns after payment; `noindex` |
| `/billing/cancel` | **no** | where Stripe returns if the user backs out; `noindex` |

The two return pages are transactional and only meaningful with a `session_id`, so
they are deliberately kept out of `scripts/generate-sitemap.js`. Don't add them.

### Prices are not ours to state

`/billing` renders the catalog from `GET /api/billing/products/`. Prices, credit
amounts, and product keys live in the backend's `billing/products.py` and **must not
be hardcoded here** — same contract as the model catalog. Checkout POSTs only a
`product_key`; the amount charged is resolved server-side, so repricing is a
backend-only change this app picks up on the next load.

### The webhook race

Stripe redirects to `/billing/success` the moment the card clears, but credits are
granted by a backend webhook that lands a beat later. Reading the balance once on
that page will sometimes show the **pre-purchase** number — which reads as a failed
payment to a user who was just charged.

`BillingSuccess` therefore polls `GET /api/billing/checkout-status/`, which reports
`paid` (Stripe has the money) and `fulfilled` (the backend applied it) as separate
facts, until `fulfilled`. After ~30s it falls back to "payment received, credits on
the way" rather than implying failure — at that point the money is definitely taken
and the webhook will still land.

Keep that distinction if you touch this page. Collapsing `paid` and `fulfilled` into
one boolean reintroduces the bug.

### Local development gotcha

The backend builds Checkout return URLs from its own hardcoded `SITE_URL`
(`https://aiartarena.com`). Starting checkout from `localhost:3000` will therefore
redirect to the **production** site on completion, not back to your dev server.
Testing the success page locally requires pointing the backend's `SITE_URL` at
`http://localhost:3000`.

## Git workflow

Branch off `main` for features and open a PR for review before merging — don't commit directly to `main`.
