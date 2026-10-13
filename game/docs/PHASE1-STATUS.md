# CHEMORA — Phase 1: Connected Indoor Lab Complex

## Scope
Replace the outdoor/campus world prototype with one connected, indoor chemistry laboratory complex. Keep the existing chemistry engine, vessel registry, pour/fill components, journal, HUD and mobile controls in place. No outdoor world, vehicles or town are included.

## Planned layout implemented in source
- Main teaching/synthesis lab (existing player start and four existing stations)
- Chemical storage room
- Weighing room
- Instrument room
- Safety & PPE room
- Waste disposal room
- Office/research log room
- Indoor corridors linking the rooms through aligned openings

## Files changed
- `src/App.tsx` — removed outdoor campus/map imports and the oversized outdoor ground collider; reduced camera far plane for the indoor complex.
- `src/components/game/LabRoom.tsx` — kept the existing component export but delegated room construction to the modular indoor complex.
- `src/components/game/PlayerController.tsx` — clarified that the Rapier capsule movement is for the indoor collision-backed floors; movement/interaction controls otherwise retained.
- `src/rooms/LabComplex.tsx` — new procedural room shells, tiled floors, room/corridor floor colliders, wall colliders with door openings, lintels, indoor LED panels, room lighting and visual room identifiers.
- Removed `src/world/CampusWorld.tsx` and `src/world/WorldMap.tsx` from the active project.

## Assets and licenses
No downloaded or third-party art assets were added. All meshes, materials and the tile texture are generated procedurally in code. No external asset license is required for these generated primitives/texture.

## Verification status
- Source/ZIP structural checks: pending final archive check.
- `pnpm typecheck`: **NOT RUN** — `pnpm` is not installed in this environment, and Corepack could not fetch it because the npm registry DNS/network request failed.
- `pnpm build`: **NOT RUN** for the same dependency/tooling limitation; the project has no installed `node_modules` in this working copy.
- Runtime/browser test: **NOT RUN**.

This is not marked as a verified Phase 1 completion until both required commands pass. Run from the extracted project root:

```bash
pnpm install
pnpm typecheck
pnpm build
```

## Known issues / Phase 1 boundaries
- The room shells, wall/floor collisions and light placement are procedural; a real browser/device walkthrough is still needed to validate door alignment and navigation feel.
- The current four stations and their interaction/camera presets remain concentrated in the main teaching lab. Additional room equipment and room-specific interactions are Phase 2+.
- Current lighting uses a few point lights and emissive panels, not baked lightmaps or a complete physically based lighting pipeline.
- Room culling, quality presets, detailed equipment, hazard-labeled reagents and new safety/progression systems are not part of Phase 1.
