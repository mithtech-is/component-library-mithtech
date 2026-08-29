# Vue P0 component contracts

Status: **implemented and verified locally**  
Canonical visual source: approved offline TonalDepth HTML

## Exports

| Export | Contract |
|---|---|
| TdButton | Vue attributes/events, default and named slots, variants/sizes, disabled/loading semantics, and exposed native element. |
| TdBadge | Native attributes, default slot, and neutral/brand/success/accent/danger variants. |
| TdCard composition | Card, header, title, and content slots with raised/flat/inset depth. |
| TdInput / TdTextarea | Native attributes, controlled `modelValue` updates, invalid/disabled state, field-context wiring, and exposed native element. |
| TdFormField | Label/help/error/required/optional composition and automatic TonalDepth control associations. |

## Boundaries

- Vue 3.5 is the current peer baseline.
- Nuxt consumes the same Vue package; there is no duplicate Nuxt implementation.
- Existing `.td-*` classes, `--td-*` variables, fonts, themes, and density settings are preserved.
- The Vite Vue catalog is internal rendered QA, not documentation.
- Storybook integration remains deferred.

## Verification

- TypeScript production build passes.
- Seven unit, model, semantic, slot, and accessibility tests pass.
- Rendered browser QA passes in both themes and densities with zero overflow and no current-session warnings/errors.
- Clean packed Vite Vue and Nuxt builds pass without workspace aliases; Nuxt emits its server entry and public assets.
