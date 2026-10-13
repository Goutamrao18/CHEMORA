# CHEMORA Account UI Update

## UI changes
- New account sign-in card with clearer copy, a visual brand mark, improved spacing, responsive inputs and buttons.
- Updated account dashboard title, progress shortcut, profile hero, navigation, metrics and tab styling.
- Better small-screen navigation and card stacking.
- Visible keyboard focus, reduced-motion support, and ARIA tab/progress semantics.
- Removed misleading static progress percentages; account overview now reads challenge completion and answer accuracy from `chemoraChallengeState` in local storage.

## Behaviour preserved
- Existing Supabase sign-in, sign-up, profile update, password update, avatar upload, and sign-out code paths and element IDs are retained.

## QA status
- Inline JavaScript syntax check and static local-link checks are part of the packaging validation.
- Browser interactions and live Supabase configuration have not been tested by this packaging step.
