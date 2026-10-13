# CHEMORA Stabilization Test Checklist (Phase 6)

Run with `pnpm install`, `pnpm typecheck`, `pnpm build`, and `pnpm lint` before interactive QA. Mark each item only after testing it in the browser; this file is a checklist, not a claim that these tests have already passed.

## Movement and room collisions

- [ ] Main lab: walk to each wall and door opening; verify walls block movement and openings remain traversable.
- [ ] Storage room and corridor: test entry before and after the first protocol is completed.
- [ ] Weighing room and corridor: enter and exit without getting caught on lintels or floor edges.
- [ ] Instrument room and corridor: test entry before and after two protocols are completed.
- [ ] Safety bonus room: confirm it remains reachable and contains no required safety equipment dependency.
- [ ] Waste room and corridor: test entry before and after three protocols are completed; check barrier and visible mesh align.
- [ ] Research office and corridor: enter and exit in both directions.
- [ ] Test collision while moving diagonally and along every corridor wall; confirm the catch floor prevents falling out of the level.

## Door states and signs

- [ ] Storage door blocks entry at 0 completed protocols and shows “LOCKED · COMPLETE 1 PROTOCOL”.
- [ ] Storage door opens at 1 completed protocol.
- [ ] Instrument door blocks entry below 2 completed protocols and displays the correct count; opens at 2.
- [ ] Waste door blocks entry below 3 completed protocols and displays the correct count; opens at 3.
- [ ] Confirm locked-barrier collider orientation matches the visible barrier on north/south and east/west doors.
- [ ] Confirm Safety access and all safety equipment are available from the start, without completing protocols.

## Equipment pickup, placement, and persistence

- [ ] Pick up a bottle, beaker, flask, and tool; verify each has a distinct hand model.
- [ ] Verify a picked-up item disappears from its shelf and is not duplicated in the world.
- [ ] Place six small items on the same bench/balance; confirm each uses a separate slot.
- [ ] Attempt to place a seventh item on a full target; confirm it remains held and a full-target message appears.
- [ ] Place items on separate benches; confirm each target has its own slots.
- [ ] Drop an item without a valid target; confirm it returns to its home rack/shelf position.
- [ ] Reload the page and confirm placed item positions persist and there are no duplicate copies.
- [ ] Confirm reset progress returns moved equipment to its default locations.

## Tutorial, PPE, and safety events

- [ ] Complete the tutorial in order: put on PPE, pick up beaker, weigh reagent, add liquid, heat, record in journal.
- [ ] Confirm only one tutorial prompt is shown at a time and the next step advances only after its condition is met.
- [ ] Toggle goggles, gloves, and coat; verify each state is reflected in the HUD.
- [ ] Trigger spill, fire, and broken-glass drills; verify warning/incident UI and response actions.
- [ ] Use the spill kit and extinguisher from the main lab; confirm no Safety-room access is required.
- [ ] Confirm safety warnings never exceed 20 entries after repeated events.

## Audio and Settings

- [ ] Confirm no audio starts before a user gesture.
- [ ] After the first gesture, verify ambient hum, footsteps, pickup/place clinks, reaction bubbling, burner hiss, door/lock sounds, and safety warning beeps.
- [ ] Test master volume at 0%, 50%, and 100%; test mute/unmute.
- [ ] Confirm one Settings panel controls camera sensitivity, graphics quality, post-processing, audio, FPS/draw calls in development, and reset progress.
- [ ] Confirm closing Settings resumes movement and opening Settings pauses movement.
- [ ] Confirm FPS/draw-call overlay is only available in development builds.

## Save and reset

- [ ] Make repeated state changes rapidly and verify persistence updates are throttled to no more than one write per two seconds during normal activity.
- [ ] Change state, hide the tab, then return; verify the latest state was flushed on `visibilitychange`.
- [ ] Reload and verify expected progress, PPE/safety state, and item positions persist.
- [ ] Reset progress and confirm progress, incidents, held item, moved equipment, and safety state return to defaults.

## Graphics presets and responsive layouts

- [ ] Desktop: test Low, Medium, and High; verify Low disables post-processing and reduces rendering cost.
- [ ] Phone: test Low, Medium, and High with touch movement, interaction, journal, and Settings.
- [ ] Verify safe-area padding on a phone with a display cutout and in landscape orientation.
- [ ] Verify HUD controls do not obscure the center crosshair or prevent aiming at equipment.
- [ ] Check FPS/draw calls in development and note device, browser, preset, and observed values.
