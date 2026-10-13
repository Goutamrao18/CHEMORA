# CHEMORA Phase 5 — Item Handling, Audio, Mobile, Tutorial

## Implemented
- Equipment is removed from its original shelf while held, rendered in the carried view, and reappears as the same world item when placed on a nearby bench/balance. Placement snaps to half-unit coordinates; dropping returns the item to its first observed home position. Position/home-position metadata is persisted.
- PPE rack moved to the main lab near the entrance. Safety room keeps emergency equipment, and its north doorway connects to the safety corridor independently of the instrument-room progression gate.
- Progress writes are throttled to at most one normal localStorage write every two seconds, with a pending-save flush on tab hide. Safety warnings are capped to the latest 20. Settings include reset progress.
- Tone.js audio: ambient ventilation hum starts only after a user gesture; master volume and mute; footstep tones vary by floor zone; glass clink on pickup/place; bubbling on bubbling reactions; burner hiss follows hotplate state; lock/unlock tones and safety warning beeps.
- Mobile controls have larger touch targets and safe-area padding, a pause/settings action, and a run toggle. Settings pauses player movement. Low graphics preset reduces lighting, disables the point light, antialiasing, postprocessing, and shadow maps.
- Guided first-lab tutorial presents one step at a time: PPE, pick up beaker, weigh, add liquid, heat, journal record.
- Dev-only render overlay reports room, held item, FPS, and draw calls.

## Files changed
- `src/App.tsx`
- `src/components/game/MainHUD.tsx`
- `src/components/game/MobileControls.tsx`
- `src/components/game/PlayerController.tsx`
- `src/equipment/EquipmentComplex.tsx`
- `src/equipment/EquipmentInteraction.tsx`
- `src/gameplay/GameplayHUD.tsx`
- `src/gameplay/TutorialGuide.tsx` (new)
- `src/gameplay/audio.ts`
- `src/gameplay/gameState.ts`
- `src/rooms/LabComplex.tsx`
- `src/index.css`
- `src/vite-env.d.ts` (new)
- `PHASE5-STATUS.md` (new)

## Verification status
- TypeScript syntax transpilation passed for the changed TS/TSX files.
- Full `npm run typecheck` / `npm run build` could not be verified in this environment: project dependencies are absent; `npm install --ignore-scripts --no-audit --no-fund` timed out while reaching the npm registry, and the TypeScript run consequently reported missing dependency/type declarations. This is an environment limitation, not a passing typecheck/build result.
- No browser, touch-device, audio, or performance runtime tests were available here.

## How to test
1. In the project directory run `npm install`, then `npm run typecheck` and `npm run build`.
2. Run `npm run dev` and start a session. Put on all PPE, pick up the beaker set, place it on a bench/balance, then pick it up and drop it. Confirm the item never duplicates and returns to its original position on drop.
3. Move to the main entrance and confirm the PPE rack is there. Visit the safety room while the instrument room is progression-locked; confirm the eyewash, shower, and extinguisher remain accessible.
4. Open Settings, test master volume/mute, reset progress, and confirm the next progress change persists after at least two seconds or when the tab is hidden.
5. After the first pointer/key gesture, test hum, footsteps, pickup/place clinks, reaction bubbling, hotplate hiss, door/lock tones, and safety warning beeps.
6. On touch, test joystick movement, RUN toggle, pause/settings, safe-area spacing, and the tutorial steps. On a development server, enable FPS/draw calls to inspect room, held item, FPS, and draw calls.

## Known limitations / dead-code audit
- Full typecheck/build and runtime behavior remain unverified until dependencies can be installed.
- The carried hand-view remains a generic procedural bottle/glassware visual; the actual item is what moves in the world, but its in-hand silhouette is not yet matched to every equipment type.
- Placement is snapped to the target equipment's center rather than selecting a free spot across the whole tabletop. Equipment positions persist; vessel contents and analysis reports are not included in this persistence payload.
- Tutorial action buttons execute the corresponding simplified simulation action directly as a guided shortcut; players can also perform the actions through normal controls.
- The project has two Settings entry points (`GraphicsSettingsPanel` in `App.tsx` and the existing modal in `MainHUD.tsx`); both are active, so this is duplicated UI rather than confirmed dead code. The existing Tone.js scale/pour/analysis/reaction functions are still referenced by `StationHUD.tsx`.
