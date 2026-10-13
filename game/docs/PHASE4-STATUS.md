# CHEMORA Phase 4 — Procedures, Safety, Progression

## Scope delivered
- Fixed the prior graphics quick fixes: Canvas owns DPR; postprocessing no longer calls `gl.setPixelRatio`; shadow maps are enabled only at High; equipment meshes receive castShadow from quality settings; FPS/draw-call display toggle added in Settings.
- Added a camera-attached visual for one carried equipment item, interact/E pickup/place/drop event flow, and a storage-return message for drops.
- Extended `chemistry.ts` with educational simulation helpers for titration, filtration, heating, stirring, and pH measurement; connected these helpers to the Zustand game store.
- Added PPE toggles, safety score, warnings, spill/fire/broken-glass drills and response actions, waste-stream scoring, and safety HUD controls.
- Added localStorage persistence for protocol/task progress and PPE/safety state.
- Added physical doorway barriers for chemical storage, instrument, and waste rooms until 1, 2, and 3 protocols are completed respectively.

## Files changed
- `src/App.tsx`
- `src/components/game/PlayerController.tsx`
- `src/equipment/EquipmentInteraction.tsx`
- `src/equipment/EquipmentPrimitives.tsx`
- `src/equipment/EquipmentCarryView3D.tsx` (new)
- `src/gameplay/GameplayHUD.tsx` (new)
- `src/gameplay/gameState.ts`
- `src/gameplay/chemistry.ts`
- `src/graphics/GraphicsPipeline.tsx`
- `src/graphics/quality.ts`
- `src/rooms/LabComplex.tsx`

## Verification status
- `pnpm typecheck`: NOT RUN SUCCESSFULLY — shell returned `pnpm: command not found` (exit 127).
- `pnpm build`: NOT RUN SUCCESSFULLY — shell returned `pnpm: command not found` (exit 127).
- No browser/runtime or performance test was run.

## Known limitations
- Carrying is represented by a camera-attached procedural visual and store state; it is not a full physics-based pickup system. Placement/drop clears the carried item, and dropping reports a return-to-rack message rather than simulating rack transport.
- Procedure helpers are educational abstractions, not full stoichiometric simulations. Titration is simplified and the action buttons can be used without all required apparatus.
- PPE scoring currently penalizes procedure actions while PPE is incomplete; it does not yet distinguish chemical-specific PPE requirements.
- Incident drills are user-triggered demonstrations, not stochastic world events.
- Progress stores task IDs and safety/PPE state; full vessel contents and reports are not persisted.
- Room access is gated by completed protocol count, not specific named protocol prerequisites.
