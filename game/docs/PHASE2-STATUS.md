# CHEMORA — Phase 1 review fixes + Phase 2 equipment foundation

## Included
- Corridor side walls with Rapier fixed colliders and overhead ceilings.
- Broad fixed catch collider below the connected indoor complex.
- Room-name signs mounted on each room's north interior wall, with room-name canvas textures.
- Office corridor dimensions adjusted to run exactly from the main lab north wall to the office south wall.
- Per-room floor and wall tinting driven by each room accent color.
- Modular procedural equipment in `src/equipment/` with stable IDs, hover/click prompt hooks, and an on-screen interaction prompt.
- Procedural GHS-style reagent labels drawn on canvas textures; repeated bottle bodies/liquids/caps use instanced meshes.
- Equipment sets for main lab, chemical storage, weighing, instruments, safety/PPE, waste, and office.
- Large equipment items include fixed Rapier colliders where configured.
- Existing four station components and chemistry/journal/liquid/mobile-control modules were not rewritten.

## Assets and licenses
- No external model, texture, sound, or image assets were added.
- Geometry, tile texture, room signs, reagent labels, and waste-bin labels are generated procedurally in code.
- External asset license list: none (no external assets used).

## Verification performed
- TypeScript/TSX syntax transpilation: passed for all 24 files under `src/` using the globally installed TypeScript transpiler.
- Equipment ID audit: 66 declared equipment IDs, all unique.
- Required room group audit and GHS hazard category source checks: passed.
- `pnpm typecheck`: NOT RUN — `pnpm` is not installed in this environment (`pnpm: command not found`).
- `pnpm build`: NOT RUN — `pnpm` is not installed in this environment (`pnpm: command not found`).
- `npm install --ignore-scripts --no-audit --no-fund`: timed out after 300 seconds without producing `node_modules`.
- A fallback global `tsc -b` attempt could not typecheck because project dependencies and their type declarations were unavailable. This is an environment/dependency limitation; it is not a successful typecheck.
- No browser runtime or performance testing was performed.

## How to test on a machine with package registry access
From `project/`:

```bash
pnpm install
pnpm typecheck
pnpm build
pnpm dev
```

Then verify room transitions, corridor wall/ceiling alignment, fall recovery, signs/material tints, equipment hover prompts, reagent label readability, and the existing four station interactions on desktop and Android Chrome.

## Known issues / scope boundaries
- Phase 2 provides procedural equipment representations, not final high-fidelity models.
- Interaction is limited to hover/click prompt display; equipment does not yet pick up, move, heat, weigh, pour, or trigger gameplay logic.
- GHS labels are simplified game-style pictograms and should not be treated as authoritative chemical hazard labels.
- Some compact equipment silhouettes are generic stand-ins (for example, glassware sets and some instruments); further visual refinement is needed.
- The project has not passed `pnpm typecheck` or `pnpm build` in this environment, so this package is not marked verified or release-ready.
