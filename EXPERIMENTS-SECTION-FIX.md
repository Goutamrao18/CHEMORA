# Experiments section reliability update

## Fixed

- Loaded `experiments/experiments.css`, fixing the missing experiment-specific styling and the modal’s hidden state.
- Kept the modal hidden in the initial HTML with the `hidden` attribute; the stylesheet now enforces `[hidden] { display: none !important; }`.
- Scoped overrides so global reference UI rules do not squeeze the experiment hero text or allow the site navigation to appear above the modal.
- Added dialog semantics, a clear accessible close button, Escape-to-close, Tab focus containment, focus restoration, body scroll lock, keyboard activation for experiment cards, filter pressed states, and live result counts.
- Replaced the invalid Catalyst video and missing Electrolysis video with 15-second H.264 animated explainers without audio. The clips are clearly labelled as animations, not recorded lab footage.
- Added an accessible step-by-step visual guide that appears if a video fails to load.
- Made progress completion resilient to browser storage failures and announce when completion could not be persisted.
- Added `npm run test:experiments` regression checks.

## Validation performed

- `npm run test:experiments` — passed (20 experiments, all video files present and non-empty, modal/accessibility/fallback code checks).
- `npm run validate:project` — passed (100 levels, 1,000 questions, 1,000 unique question IDs, local references).
- `npm run test:smoke` — passed basic API request/error tests. Live AI responses remain unverified if `OPENROUTER_API_KEY` is not configured locally.
- Chromium interaction test — passed: all/Beginner/Intermediate/Advanced filters return 20/11/8/1 cards; modal state and focus handling work; both repaired videos load 15-second metadata; a forced media failure activates the visual guide; card keyboard activation works; mobile width 360 has no horizontal overflow and the modal stays within viewport; no console or page errors in the browser harness.
- `ffprobe` confirmed all 20 experiment-specific videos have playable stream metadata and a duration.

## Remaining note

The two replacement videos are educational animations with no audio. Teachers should still review experiment procedures and safety notes for their classroom context.
