# Model audio

Generated delivery files live in `lessons/<lesson-id>/`. They are produced by `npm run audio:generate` and registered in `src/content/audio-manifest.json`. Do not add, rename, or edit files here by hand; follow `docs/AUDIO_PRODUCTION.md`.

Lessons without files intentionally use the browser speech demo, so the app never pretends silence is model speech.
