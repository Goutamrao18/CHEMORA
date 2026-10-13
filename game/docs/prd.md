# CHEMORA Product Requirements Document

## 1. Product overview
CHEMORA is a browser-based first-person 3D chemistry simulation set inside a connected indoor laboratory complex. The core experience is to explore rooms, handle glassware and lab equipment, prepare mixtures, run simplified reactions, analyze results, and record progress in a research journal.

## 2. Supported technology
- React + TypeScript + Vite
- Three.js and React Three Fiber for rendering
- Rapier for collision and player movement
- Zustand `persist` for versioned progress storage
- Tone.js for gesture-unlocked synthesized laboratory audio
- Vitest for chemistry engine unit tests

## 3. Indoor layout and access rules
| Room | Purpose | Access |
|---|---|---|
| Main teaching/synthesis lab | Spawn, general glassware, PPE rack, emergency response equipment, work surfaces | Available at start |
| Chemical storage | Reagent cabinets and refrigerator | Unlock after 1 completed protocol |
| Weighing room | Analytical balances and anti-vibration tables | Available through corridor |
| Instrument room | Analysis and measurement instruments | Unlock after 2 completed protocols |
| Safety room | Bonus room; no safety equipment is exclusive to it | Never required for safety access |
| Waste room | Waste segregation | Unlock after 3 completed protocols |
| Research office | Journal and research workspace | Available through corridor |

`src/layout.ts` is the single source of truth for room bounds, corridor definitions, room IDs, lock thresholds, and position-to-room detection. Door collider orientation is derived from the same orientation variables as the visible barrier.

## 4. Core interaction loop
1. Start in the main lab and equip the required PPE.
2. Inspect and pick up registered equipment.
3. Carry, place on a valid target, or return an item to its home position.
4. Dispense or transfer measured reagent quantities between vessels.
5. Run simplified procedures such as titration, heating, stirring, and filtration.
6. Analyze results and record them in the journal.
7. Complete protocols to unlock designated rooms.

## 5. Chemistry and transfer rules
- Reactions require recognized reagents and amounts within the defined simulation ranges.
- Transfers reject non-finite or non-positive volumes, empty sources, source underflow, and destination overflow.
- Invalid additions do not mutate the original container.
- Titration and other procedure helpers return new content state and clamp simulation values to valid bounds.
- These are educational models and must not be presented as experimentally validated predictions.

## 6. Persistence requirements
- Use Zustand `persist` with an explicit version, partialized state, and migration function.
- Persist equipment positions and the held equipment ID so a held item does not reappear on its rack after reload.
- Persist research progress, safety state, vessel contents, and audio preferences.
- Keep transient UI state out of the persisted payload.

## 7. Performance requirements
- Reuse module-level equipment materials and textures where practical.
- Dispose runtime-created Three.js resources on module hot disposal.
- Raycast only registered interactable roots at approximately 10 Hz.
- Use the current room ID to control room and equipment visibility.
- Limit room accent point lights to the current room and at most one neighboring room.
- Avoid allocating temporary Three.js vectors and quaternions in the player frame loop.

## 8. Verification
Run `pnpm install`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm lint`. CI runs the same checks. Manual verification should cover room movement/collisions, lock thresholds, equipment pickup/place/drop and reload, chemistry validation, audio gesture policy, and Low/Medium/High graphics presets on desktop and phone.

## 9. Out of scope
- Outdoor/open-world exploration
- Multiplayer
- User-authored chemistry model editor
- Real-world laboratory guidance or validated chemical prediction
