---
name: build-check
description: Run the production build and verify SEO artifacts before shipping. Use before deploying or opening a PR to catch TypeScript/build errors and confirm the sitemap and robots.txt were generated.
---

# Build check

Verify the app builds cleanly and the SEO artifacts are produced.

1. Run the production build:
   ```
   npm run build
   ```
   This compiles the CRA app to `build/` and its `postbuild` step runs `scripts/generate-sitemap.js`.

2. If the build fails, surface the TypeScript / compile errors clearly and stop — do not proceed to verification.

3. On success, confirm both SEO artifacts exist and look sane:
   - `build/sitemap.xml` — should contain a `<url>` entry for every public route. Cross-check against the `routes` array in `scripts/generate-sitemap.js`; if a route in `src/App.tsx` is missing here, flag it.
   - `build/robots.txt` — should reference the sitemap URL.

4. Note: the sitemap URLs use `SITE_URL` / `REACT_APP_SITE_URL`. If they show `https://yourdomain.com`, the env var wasn't set — warn the user that a real `SITE_URL` is needed for a correct production sitemap.

5. Report a short summary: build status, route count in the sitemap, and any warnings.
