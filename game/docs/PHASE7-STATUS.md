# CHEMORA Phase 7 — Audit Fixes

## Implemented
- Removed `miaoda-sc-plugin` and `vite-plugin-svgr` from Vite configuration and dependencies.
- Reduced runtime dependencies to those used by source: React, React DOM, Three.js, React Three Fiber, Rapier, postprocessing, Zustand, Tone.js, and lucide-react. `@react-three/drei` is not imported and is not retained.
- Aligned `@types/three` to the Three.js `0.181` line.
- Replaced CI configuration with GitHub Actions steps for pnpm install, typecheck, build, lint, and unit tests.
- Added shared cached equipment surface/accent/basic materials and cached label textures; hot-dispose releases the cached Three.js resources.
- Registered interactable roots; interaction targeting scans only the registry every 100 ms and reuses its ray, vectors, box, and hit point.
- Added per-room equipment selectors and current-room visibility. The player frame loop reuses movement vectors, quaternions, and translation objects.
- Added room-specific point lights for the current room and one neighbor; removed the origin point light.
- Centralized room geometry, corridors, door openings, locked-door orientations/thresholds, adjacency, room detection, and footstep floor type in `src/layout.ts`.
- Replaced manual progress persistence with versioned Zustand `persist`, partialized state, and a migration path for the legacy `chemora-phase5-progress-v1` payload. New saves include `heldEquipmentId` and `equipmentPositions`.
- Added Vitest chemistry tests for neutralization, transfers, titration, and invalid inputs.
- Updated README and PRD for the indoor laboratory; moved Phase 1–6 status notes into `docs/`.

## Actual checks in this environment
- `pnpm install`: could not start — `pnpm: command not found` (exit 127).
- `pnpm typecheck`: could not start — `pnpm: command not found` (exit 127).
- `pnpm test`: could not start — `pnpm: command not found` (exit 127).
- `pnpm build`: could not start — `pnpm: command not found` (exit 127).
- `pnpm lint`: could not start — `pnpm: command not found` (exit 127).
- `corepack pnpm --version`: failed while fetching pnpm from `registry.npmjs.org`; DNS returned `EAI_AGAIN`.
- Global `tsc --noEmit -p tsconfig.app.json`: failed because dependencies and React/JSX types are not installed; the output includes missing-module errors and cascading JSX/type errors, so it does not establish whether the project typechecks after install.
- TypeScript syntax transpilation: 31 `.ts`/`.tsx` files scanned, zero syntax diagnostics.
- Manual chemistry assertions run against transpiled `chemistry.ts`: 16 assertions passed across chemistry and layout (neutralization, proportional transfer, titration pH, invalid volume, unknown reagent, destination overflow, seven room-center detections, and locked-door metadata).

## Remaining risks / unverified
- Full typecheck, Vitest runner, production build, and Biome lint are unverified until pnpm/dependencies can be installed.
- Held-item persistence is wired through Zustand's persisted `heldEquipmentId` and `equipmentPositions`, but a browser reload test was not possible here.
- Interactable targeting uses registered root bounding boxes (AABB); rotated objects are not rotated into oriented boxes, so interaction alignment can be approximate for rotated equipment.
- Runtime rendering, lighting, and room transitions were not browser-tested.
