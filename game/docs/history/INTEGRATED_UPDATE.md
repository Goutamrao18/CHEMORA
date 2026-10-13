# CHEMORA Integrated Update — Liquid Interaction Bundle

This bundle combines the prior incremental patches into one project snapshot. It is based on the existing React + TypeScript + Vite + React Three Fiber project and preserves the original application structure.

## Included
- Existing player movement/station interactions from the movement-interactions project snapshot.
- Existing guarded chemistry transfer logic and successful-transfer visual event.
- Runtime vessel registry using vessel IDs and Three.js world transforms.
- Vessel liquid fill interpolation toward authoritative store volume.
- Animated liquid surface and bounded bubble effects.
- Timed pouring stream, source tilt, droplets, and impact ring.
- App integration rendering the stream inside the Three.js Canvas.

## Install
1. Back up your working project.
2. Extract this archive into a new folder (recommended), rather than merging patches one by one.
3. In that folder run `pnpm install`, then `pnpm build`.
4. If the build passes, run `pnpm dev --host 0.0.0.0`.

On Android/Termux, keep the project in private home storage, for example `~/projects/CHEMORA_complete_update`, rather than `/storage/emulated/0`, to avoid symlink restrictions.

## Important limitations
- The store commits the chemical transfer immediately; the stream and vessel fill interpolation are visual effects and are not a continuous-time chemistry transaction.
- The liquid is procedural geometry/shader-style animation, not computational fluid dynamics.
- Vessel mouth/surface points use approximate local dimensions; unusual vessel scales/types may need per-type calibration.
- This bundle has not been run through a full TypeScript build or browser playtest in this environment. Treat build/runtime verification as the next step; no successful test is claimed.
