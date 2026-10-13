# CHEMORA Challenge Plus

## Improvements
- Validates and normalizes saved challenge state, while retaining legacy progress where possible.
- Handles unavailable local storage without stopping the quiz.
- Emits a `chemora:progress` event after state updates for cross-page progress consumers.
- Awards level-completion XP only on first completion, preventing repeated replay farming.
- Records best per-level result for future progress UI.
- Prevents the next-level control from trying to open level 101 after finishing level 100.
- Uses text nodes for answers and feedback explanations instead of inserting question data as HTML.
- Improves answer selection semantics and keyboard focus indicators.
- Shows a useful toast and console error when a level fails to load.

## Validation
- Archive integrity and all challenge JSON files checked.
- JavaScript syntax check performed on the embedded challenge script.
- Browser interaction testing and screen-reader testing are still required.
