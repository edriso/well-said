# Working on Well Said

Well Said is a static, mobile-first React application for short daily English speaking workouts. Protect its deliberately small scope: every feature should help a learner listen, notice rhythm, speak, or return tomorrow.

## Before changing code

- Read `README.md` and the relevant document in `docs/`.
- Keep lesson content separate from presentation. Curriculum changes belong in `src/content/lessons.ts`; do not hard-code dialogue in components.
- Preserve existing public APIs and the versioned localStorage shape, or document and test a migration.
- Never commit generated studio audio without checking naming, loudness, license/provenance, and repository size.

## Quality bar

- Use strict TypeScript and semantic HTML. Controls must be keyboard accessible, clearly named, and usable at 320 CSS px and 200% zoom.
- Stress must not be conveyed by color alone. Keep underline/weight and textual explanations.
- Never autoplay audio or make microphone access mandatory. Recordings stay local unless the product explicitly changes.
- Respect `prefers-reduced-motion` and maintain WCAG 2.2 AA contrast.
- Run `npm run check` before committing.
- Do not add AI attribution, co-author trailers, or signatures to commits.

## Product language

Prefer “model audio,” “speaking practice,” “clearer,” and “more natural.” Avoid promising accent removal, native speech, fluency scores, or diagnostic pronunciation feedback.

## Deployment

The production base path is `/well-said/`. `main` deploys through `.github/workflows/deploy.yml` to GitHub Pages. See `docs/DEPLOYMENT.md`.
