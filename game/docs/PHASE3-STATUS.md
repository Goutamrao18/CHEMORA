# CHEMORA Phase 3 — Graphics and Touch Interaction

## Implemented in this phase
- Center-screen raycast prompt, with a 2.5 m ray range and a camera-to-equipment distance check. Equipment IDs are preserved. The existing mobile INTERACT event publishes the current raycast target.
- Procedural PBR-style material variation: generated canvas texture maps for equipment roughness/bump variation, painted-wall noise, tiled/grouted floors, and room-accent reflections.
- Detailed procedural passes for fume hoods, analytical balances, burners, microscope, hot plate stirrer, centrifuge, extinguisher, and waste-bin details; instanced reagent bottles now have tapered bodies, shoulders, necks, and caps.
- Room LED panels remain emissive; removed per-room and corridor point lights to keep the active scene light count bounded. Main scene uses ambient light, one directional light, and one point light (vessel glow lights remain conditional).
- Settings panel with Low / Medium / High presets, post-processing toggle, ACES tone mapping, optional N8AO, bloom, and SMAA. Post-processing defaults off for coarse-pointer/touch devices. Quality auto-detection uses device memory, core count, and a short startup frame-pacing sample.
- Equipment groups are hidden when far from their room region to reduce visible equipment outside the current and nearby room areas.

## Files changed
- `src/App.tsx`
- `src/equipment/EquipmentInteraction.tsx`
- `src/equipment/EquipmentPrimitives.tsx`
- `src/equipment/EquipmentComplex.tsx`
- `src/equipment/ReagentBottleShelf.tsx`
- `src/rooms/LabComplex.tsx`
- `src/graphics/quality.ts` (new)
- `src/graphics/GraphicsPipeline.tsx` (new)

## How to test (not run as part of this phase)
1. Run `pnpm typecheck` and `pnpm build` when verification is requested.
2. Start the game and aim the center of the screen at equipment within 2.5 m. Confirm the ID and prompt change with the target.
3. Use the mobile INTERACT button while aiming at an item; confirm it retains the current raycast prompt.
4. Open Settings and switch Low / Medium / High; toggle post-processing on Medium or High.
5. Walk between rooms and check that distant equipment groups are hidden and nearby-room equipment remains visible.
6. Inspect fume hoods, balances, burners, hot plate, microscope, centrifuge, extinguisher, bins, and bottle labels.

## Known issues
- Per-request instruction was to defer verification until explicitly requested. `pnpm typecheck`, `pnpm build`, FPS, draw calls, and browser/runtime checks have not been run; no pass claims are made.
- FPS and draw calls are not yet displayed in the UI, and no preset benchmark numbers are available.
- Room culling is distance-region based rather than exact doorway/portal visibility culling; reagent shelf visibility is not yet culled independently.
- RectAreaLight was avoided for mobile compatibility; LED panels use emissive geometry plus a capped small number of dynamic lights.
- Generated normal-style canvas texture is a subtle bump/roughness approximation, not a physically calibrated tangent-space normal map. Floor reflection is a subtle accent overlay, not real-time planar reflection.
- Some less prominent instruments still use shared procedural silhouettes; glassware refraction is approximate.

## Asset licenses
No external assets were added. New geometry and texture maps are procedurally generated in code. No third-party asset licenses apply to these additions.
