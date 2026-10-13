# CHEMORA Future Update Log & Release Roadmap

**Current consolidated build:** 2026-10-10  
**Rule:** updates should be grouped into complete, tested releases instead of delivered as fragmented partial patches. Preserve the existing site and chemistry learning content. Do not reintroduce the separate heavy lab application or Qwen references.

## Shipped in this consolidated build

- Challenge robustness: normalized saved state, protected one-time completion XP, safe answer rendering, level-100 completion handling, and clearer fetch failures.
- Challenge library: 100 JSON level files and 1,000 question records.
- Site polish: responsive floating tools, focus states, reduced-motion handling, and safer browser storage access.
- Learning Progress dashboard: levels completed, XP, answer count, overall accuracy, topic estimates, recommendations, and recent best level results.
- PWA foundation: manifest, app icons, service worker, selected static shell caching, offline fallback, and no caching for account HTML/API responses.
- AI endpoint hardening: bounded inputs, timeout, safer error responses, `no-store`, static tutor instructions, and best-effort per-instance throttling.
- Vercel security headers; same-origin microphone access preserved for voice functionality.
- Project validator, senior-engineer audit report, and this roadmap.

## Next release plan — prioritized

### P0 — Required before production
- [ ] Deploy a Vercel preview and test every public route on Android and desktop.
- [ ] Configure `OPENROUTER_API_KEY`, optional `OPENROUTER_MODEL`, and `SITE_URL` as server-side environment variables only.
- [ ] Configure Vercel Firewall/rate limits and provider budget controls; do not rely on in-memory throttling alone.
- [ ] Review Supabase Auth, redirect URLs, Row Level Security, storage policies, and any SQL scripts against the live schema.
- [ ] Confirm the production domain and update canonical/Open Graph/sitemap metadata consistently.
- [ ] Run manual authentication, sign-out, reset-password, and account error-path tests.
- [ ] Verify speech input/voice controls under the new same-origin microphone policy.
- [ ] Review chemical facts, answers, explanations, and experiment safety warnings with a qualified chemistry reviewer.

### P1 — Quality and reliability
- [ ] Add browser-based end-to-end tests for navigation, level loading, answer selection, replay XP, milestone rewards, level 100, and progress dashboard.
- [ ] Add accessibility checks: keyboard-only navigation, focus order, accessible names, contrast, zoom/reflow, and screen-reader announcements.
- [ ] Add a regression test for migration from older local-storage state and for storage-disabled/private browsing.
- [ ] Validate PWA install/update/offline flows and stale-cache recovery on Android Chrome and desktop browsers.
- [ ] Add a graceful empty/error state for unavailable challenge JSON and AI provider failures.
- [ ] Audit all HTML/CSS/JS for console errors, duplicate IDs, unused assets, and mobile overflow.

### P2 — Learning analytics
- [ ] Track topic performance at question level instead of estimating a topic score from the entire level's score.
- [ ] Show learning streaks and a timeline only if timestamps are captured reliably.
- [ ] Offer optional export/import of local progress, with schema versioning and validation.
- [ ] Keep progress local by default; only add cloud sync with explicit user consent and appropriate database policies.

### P3 — Content and performance
- [ ] Chemist-reviewed question bank audit for accuracy, clarity, difficulty progression, and duplicate/ambiguous questions.
- [ ] Add tests for chemical formula formatting, units, charge/superscript rendering, and equation display.
- [ ] Measure bundle/network cost on low-end Android and slow connections; optimize only from measured bottlenecks.
- [ ] Add structured content metadata and search quality tests for the chemistry library.
- [ ] Review SEO metadata and sitemap URLs against the confirmed canonical domain.

## Release log

### 2026-10-10 — Senior-engineer audit and hardening
- Fixed same-origin microphone policy conflict.
- Bumped PWA cache version.
- Limited dashboard data-fetch concurrency to six.
- Expanded validation to catch malformed challenge data, duplicate IDs, broken local references, missing precache assets, and key configuration regressions.
- Added `SENIOR-ENGINEER-AUDIT.md`.

## Validation command

Run with Node.js 18 or later:

```bash
npm run validate:project
npm run test:smoke
node --check app.js
node --check progress.js
node --check api/assistant.js
node --check service-worker.js
```

## Definition of done for future releases

1. Preserve existing working pages and chemistry content unless a change is intentional and documented.
2. Run the validator and syntax checks; add targeted tests for changed behaviour.
3. Verify internal links and mobile responsiveness.
4. Record changes, risks, and remaining manual release gates in this log.
5. Package one complete ZIP and verify its integrity before delivery.
6. Clearly distinguish automated checks from real browser tests and production deployment.


### 2026-10-10 — Account UI refresh
- Modernized the sign-in and account dashboard visual hierarchy with responsive cards, improved input/button states, and keyboard focus styles.
- Added navigation to Learning Progress.
- Replaced hard-coded account overview percentages with local challenge completion and answer-accuracy values.
- Added ARIA selected states for account tabs and accessible progress bars.
- Kept the existing Supabase authentication and profile data flow in place.
- Remaining manual QA: test login, signup/email confirmation, profile save, avatar upload, password update, logout, and all tabs against the configured Supabase project on Android and desktop.


### 2026-10-10 — Experiments section reliability and accessibility
- Linked the experiment-specific stylesheet so the intended layout and modal hidden state apply. Added an explicit hidden attribute and a robust hidden-state rule.
- Added responsive modal sizing, body scroll locking, focus restoration, Escape-to-close, modal Tab focus containment, keyboard-operable experiment cards, filter aria-pressed states, and live result announcements.
- Replaced the invalid 2-byte catalyst video and the missing electrolysis video with 15-second, no-audio animated explainers that are labelled as animations rather than lab footage. Added a built-in step-by-step fallback for any video that fails to load.
- Made completion progress resilient to unavailable localStorage and added an honest persistence message when browser storage is blocked.
- Added an experiment-specific regression test. Browser testing and chemistry teacher review remain release checks.


## Poster-matched navigation and icon repair — 2026-10-10
- Replaced the tiny poster raster used as the navigation mark with a dedicated scalable chemistry hexagon SVG.
- Restyled CHEMORA brand lettering and the `TOUCH. MIX. REACT.` tagline to echo the hero-poster cyan/violet palette.
- Added the missing Progress navigation icon and made the Account icon render consistently across pages.
- Normalized the Challenge page navigation to include Progress alongside the other primary sections.
- Added the styling to the shared site polish stylesheet so the brand and navigation remain consistent on desktop and mobile.
