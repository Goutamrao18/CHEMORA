# CHEMORA Chemical + Glassware Library Update

## Included
- Expanded the virtual reagent catalog with common educational chemicals, formulas, physical states, approximate pH, colors, and hazard labels.
- Added a searchable Lab Library panel accessible from the bottom-left of the game screen.
- Added one-click virtual dispensing into a selected vessel (5 mL for liquids, 2 g for solids), with vessel-capacity checks retained by the game state.
- Added a glassware catalog for 100 mL and 250 mL beakers, a 250 mL Erlenmeyer flask, a 50 mL graduated cylinder, and a 30 mL sample vial. New vessels enter inventory and become the held vessel.
- Added reaction-event animation with floating particles, a colored glow, and an event card for mixing, gas evolution, precipitation, and glowing reactions.
- Added simple visual reaction recognition for acid + carbonate/bicarbonate gas evolution, selected precipitation demonstrations, and starch–iodine color complex. Existing protocol reactions remain in place.

## Safety and accuracy
This is a virtual educational catalog, not a complete chemical database. Amounts, colors, pH values, and reaction outcomes are simplified simulation values. Hazard labels are abbreviated and do not replace SDS or laboratory safety training. No physical experiment instructions are provided by this feature.

## Validation status
The archive is assembled from the previous complete update. ZIP integrity is checked. A full TypeScript/production build could not be verified in this environment because project dependencies were not installed; `npm install` timed out. On the user's device, run `pnpm install` and `pnpm build` before gameplay testing.
