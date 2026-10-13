# CHEMORA Mobile Player Update

## Included
- Hybrid touch controls: left virtual joystick, right-side swipe-to-look area, and on-screen Interact / Journal / Exit Station buttons.
- Touch events are translated into player movement/look events; keyboard controls remain available on desktop.
- Landscape-first gameplay: a portrait orientation notice is shown after the game starts. Browser orientation locking is attempted after the first user gesture where supported; browsers may refuse this unless the app is installed/fullscreen.
- Adaptive renderer pixel ratio based on available device memory, CPU cores, and coarse-pointer detection. Antialiasing is disabled on the lower-resolution mobile profile.
- Touch target sizing, safe-area spacing, and reduced-motion CSS support.
- Existing chemistry, glassware, reaction, and lab systems are retained.

## Install / build on Android (Termux)
Extract this complete ZIP into a private Termux path, then run:

```sh
pnpm install
pnpm build
pnpm dev --host 0.0.0.0
```

## Verification notes
The archive can be integrity-checked with `unzip -t`. A production build could not be completed in the packaging environment because dependencies are not installed (`react`, `three`, `zustand`, and others are missing), and `pnpm` is unavailable there. Run `pnpm install` followed by `pnpm build` on the target device and share any compiler output for follow-up fixes.
