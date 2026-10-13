# CHEMORA Phase 6 — Stabilization Status

## Changes

- Locked-door barriers now use shared X/Z geometry dimensions for both the visible mesh and Rapier collider. Each protocol-gated door displays a count sign while locked.
- PPE and emergency equipment (eyewash, shower, extinguisher, first-aid kit, spill kit) are located in the main lab and are available without protocol progression. The Safety room remains a bonus room.
- Removed the second in-game Settings panel. The main Settings modal now contains quality presets, post-processing, audio volume/mute, progress reset, and a development-only FPS/draw-call toggle.
- Bench/balance placement assigns one of six persisted 3x2 slots per target; full targets reject placement without releasing the held item.
- Carried hand visuals differ for bottles, beakers/cylinders/vials, flasks, and tools.
- Added `TEST_CHECKLIST.md` for the requested manual desktop/mobile and progression QA.
- Updated the render-stats effect dependencies and removed the duplicate Settings component.

## Verification actually run

- `pnpm install`: **not run successfully**. `pnpm` is not installed (`command not found`, exit 127).
- `corepack pnpm install`: **failed** before package installation because Corepack could not reach `https://registry.npmjs.org/pnpm/latest`; DNS error `EAI_AGAIN registry.npmjs.org`.
- `pnpm typecheck`, `pnpm build`, `pnpm lint`: each attempted; all exited 127 because `pnpm` is not installed.
- `tsc --noEmit -p tsconfig.app.json`: failed because dependencies/types are absent (e.g. `react`, `@react-three/fiber`, `@react-three/rapier`, and JSX declarations); this is not a valid full typecheck result.
- TypeScript `transpileModule` syntax pass: **29 TS/TSX files scanned; no syntax diagnostics**. This checks syntax only, not type correctness.
- Browser, desktop/mobile, audio, collision, and runtime tests: **not run**.

## Remaining limitations / risks

- Full typecheck/build/lint are unverified until dependencies install successfully.
- Six slots are intended for small carryable lab items. Visual spacing may need tuning for unusually wide items.
- The Safety room is intentionally retained as an empty bonus room; emergency equipment has moved into the main lab.
- `TEST_CHECKLIST.md` lists manual test cases; none are marked as passed by this change.
