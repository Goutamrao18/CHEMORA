# CHEMORA — Indoor Chemistry Laboratory Simulation

CHEMORA is a browser-based, first-person 3D chemistry learning simulation built with React, TypeScript, Vite, Three.js, React Three Fiber, Rapier, Zustand, and Tone.js. The current experience is an **indoor laboratory complex**, not an open-world campus.

## Requirements
- Node.js 22 (Vite 8 toolchain)
- pnpm 10

## Run locally
```bash
pnpm install
pnpm dev
```
Open the local URL printed by Vite.

## Verify
```bash
pnpm typecheck
pnpm test
pnpm build
pnpm lint
```

## Indoor layout
- **Main teaching/synthesis lab:** starting room, PPE rack, emergency eyewash/shower, extinguisher, first-aid kit, spill kit, work surfaces, and general glassware.
- **Chemical storage:** locked until one protocol is completed.
- **Instrument room:** locked until two protocols are completed.
- **Waste room:** locked until three protocols are completed.
- **Weighing room:** balances and anti-vibration tables.
- **Safety room:** optional bonus room; safety equipment is not gated behind it.
- **Research office:** journal and protocol workspace.

Room bounds, corridor definitions, door thresholds, room detection, and floor-specific footsteps are centralized in `src/layout.ts`.

## Project structure
- `src/layout.ts`: indoor room, corridor, door threshold, and room detection definitions
- `src/rooms/`: room shells, walls, door barriers, and collision geometry
- `src/equipment/`: registered interactables, shared procedural materials, equipment placement and held-item visuals
- `src/components/game/`: first-person movement, stations, HUDs, journal, and mobile controls
- `src/gameplay/`: chemistry rules, persisted Zustand state, audio, and guided tutorial
- `src/gameplay/__tests__/`: chemistry engine unit tests
- `docs/`: PRD and phase status notes

## Persistence
Zustand `persist` stores research progress, safety state, vessels, equipment positions, and `heldEquipmentId`. The persisted payload uses a version and migration function; the partialized state excludes transient UI and interaction state. A held equipment item remains excluded from its rack after reloading and is restored to the hand view.

## Chemistry scope
Reactions, titration, heating, filtration, weighing, and analysis are educational simulations. They are not a substitute for laboratory procedure or safety training. See `docs/prd.md` for scope and acceptance criteria.
