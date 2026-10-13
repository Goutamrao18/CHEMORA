# CHEMORA Merge & Integration Review

**Date:** 2026-10-13 · **Scope:** `CHEMORA-git-ready.zip` (static site + API) merged with `CHEMORA_phase7_audit_fixes.zip` (3D lab game)
**Level:** static/code-level review plus the checks listed below. **Not a production certification.**

## What was done
- Site stays at the repo root; the game now lives in `game/` and is published at `/play/`.
- `Makefile` is the single entry point (`make help`): install, dev, validate, test, typecheck, lint, build, assemble, verify, preview, clean.
- `vite.config.ts`: `base` is `/play/` for production builds, `/` for dev (override with `VITE_BASE`).
- `scripts/assemble-dist.mjs` builds `dist/` (site at `/`, game at `/play/`, no source/docs/API/scripts leaked). `scripts/verify-dist.mjs` fails the build if the game's asset URLs are not under `/play/`, the dev entry shipped, or private files leaked.
- `vercel.json`: `make install` / `make build` / `dist`, `/play` → `/play/` redirect, immutable cache for hashed game assets. Existing security headers kept.
- Site wiring: "Play" link in all five nav bars, homepage card, sitemap entry, service-worker cache bumped to v3. Game menu has a "Back to CHEMORA" link when served under `/play/`.
- Validator extended: checks game files, Play links, base path, scripts, Vercel config, sitemap, `.gitignore`.
- One root CI workflow (`make verify`); the game's nested workflow (never executed by GitHub) was removed.
- Cleanup: dead `miaoda-sc-plugin` workspace entry removed; wrong favicon MIME type fixed; game phase notes moved to `game/docs/history/`; `readme.md` vs `README.md` case collision resolved (security docs → `docs/security/`).

## Verified in this environment
| Check | Result |
|---|---|
| Site validator (100 levels, 1,000 questions, links, SW precache, game wiring) | Pass |
| API smoke test, experiments regression test | Pass |
| Game chemistry tests (9) | Pass, run with a minimal vitest stand-in because real vitest could not be installed |
| 31 game `.ts/.tsx` files | 0 syntax errors, 0 unresolved local imports, 0 undeclared packages, 0 unused runtime deps |
| `assemble` → `verify-dist` → static serve | Pass using a **stub** game build; `/play/` 200, `/play` 308, `/nope` 404. Two negative cases (wrong base, dev entry) correctly fail |

## NOT verified (no network, no browser here)
`pnpm install`, `tsc -b`, Biome lint, real Vitest, the real `vite build`, WebGL rendering, pointer-lock/mobile controls, service-worker behaviour, Vercel deployment. **Run `make verify` once on a networked machine before trusting the build.**

## Findings
| # | Severity | Finding | Action |
|---|---|---|---|
| 1 | High | `game/pnpm-lock.yaml` does not exist. Builds are not reproducible and the original CI (`pnpm install`, frozen by default in CI) would fail. `make install` now falls back with a warning. | Run `make install`, commit the lockfile. |
| 2 | High (unconfirmed) | Toolchain pins are new/uncommon: Vite `^8.2.1`, plugin-react `^6`, Vitest `^3.2.4`. I could not confirm Vitest 3 supports Vite 8. | Check peer warnings on first install; bump Vitest if flagged. |
| 3 | Medium | Site service worker scope `/` also covers `/play/` (cache-first for js/css/png). Safe for hashed assets, but not tested in a browser. | Test offline/update flow on a preview deploy. |
| 4 | Medium | Game progress (`chemora-progress`, localStorage) is separate from the site's Progress dashboard/Supabase. No key collisions found, but nothing is shared. | Product decision. |
| 5 | Low | Bundle includes Three.js + Rapier + postprocessing; `chunkSizeWarningLimit` raised to silence the warning. | Lazy-load the game and split chunks after measuring. |
| 6 | Low | Interaction targeting uses axis-aligned boxes, so rotated equipment is approximate (noted by the game's own status doc). | Browser QA. |
| 7 | Low | `tsconfig.app.json` `typeRoots: ["./node_modules/**/*"]` is an unusual glob. | Remove if typecheck passes without it. |
| 8 | Low | Root `favicon.png` is 1.2 MB; ~100 MB of videos are copied into every deploy. | Compress favicon; consider external media hosting. |
| 9 | Info | Chemistry content/accuracy and the AI/Supabase production settings remain unreviewed (see `SENIOR-ENGINEER-AUDIT.md`). | Human review. |

## Release recommendation
Ready for a **preview deployment** after `make verify` passes on a networked machine and the lockfile is committed. Not certified for production until the unverified items above are checked in a real browser.
