# Deployment

Production is built and deployed by `.github/workflows/deploy.yml` after every push to `main`.

## GitHub settings

- Repository: `edriso/well-said`
- Pages source: GitHub Actions
- Public URL: `https://edriso.github.io/well-said/`
- Vite base: `/well-said/`
- Node: 24

The workflow installs the lockfile with `npm ci`, runs lint/tests/typecheck/build through `npm run check`, uploads `dist`, and deploys it with the official Pages actions. A failed quality check prevents deployment.

## Local production check

```bash
npm ci
npm run check
npm run preview
```

Open the preview URL with `/well-said/` if necessary. Verify the home page, direct `?workout=<id>` load, playback fallback, microphone denial, local progress after refresh, mobile layout, and a completed workout restart.

## Repository rename or custom domain

If the repository name changes, update all of:

- `base` in `vite.config.ts`
- icon and manifest URLs in `index.html`
- `start_url` and `scope` in `public/manifest.webmanifest`
- production references in this document

A custom root domain can use `/`, but do not change the base until DNS and Pages configuration are ready.

## Rollback

Revert the offending commit on `main` and push. The workflow will deploy the restored build. Do not manually edit generated `dist`; it is not committed and is replaced on every deployment.
