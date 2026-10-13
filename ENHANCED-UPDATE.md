# CHEMORA Enhanced Update

## Improvements in this update
- Hardened theme preference storage so restricted/private browsing storage does not crash shared UI initialization.
- Improved global search path construction for root, index, nested-section and account pages.
- Added accessible visible keyboard focus rings.
- Added responsive styling for the shared floating search/theme/assistant controls and toast messages.
- Added mobile safe-area spacing so the floating tools are less likely to cover page content.
- Respected the user's reduced-motion preference by disabling pointer tilt and reducing animations.
- Updated README wording and removed outdated section copy.

## Validation performed
- Archive integrity check.
- Challenge data JSON/schema check for all 100 levels and 1,000 questions.
- JavaScript syntax check where Node.js is available in the build environment.
- Static scan for stale navigation references.

## Not yet performed
- Full browser/device QA, screen-reader audit, live API tests, or deployment.
