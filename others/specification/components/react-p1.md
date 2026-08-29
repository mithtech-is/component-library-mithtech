# React P1 component contracts

Status: **implemented and verified locally**  
Canonical visual source: approved offline TonalDepth HTML

## Included contracts

| Export | Contract |
|---|---|
| Checkbox | Native checkbox with label, disabled/default/controlled state, native events, and ref forwarding. |
| RadioGroup / Radio | Native fieldset and legend grouping with shared name, controlled or uncontrolled selection, disabled state, native events, and refs. |
| Switch | Native checkbox exposed as a switch, with label, disabled/default/controlled state, native events, and ref forwarding. |
| Alert | Info, success, warning, and error variants; optional title and dismiss control; status or alert semantics. |
| Tooltip | Descriptive content connected to one focusable child through `aria-describedby`; CSS hover/focus visibility. |
| Dialog | Controlled state, labelled modal semantics, initial focus, focus trap, Escape/backdrop/close dismissal, and trigger-focus restoration. |
| DropdownMenu | Controlled selected value, disabled items, menu-radio semantics, click-outside/Escape dismissal, focus restoration, and Arrow/Home/End navigation. |
| Tabs | Controlled or uncontrolled value, disabled tabs, labelled tablist, automatic Arrow/Home/End activation, and associated tabpanel. |
| Table primitives | Semantic wrapper, table, head, body, row, header, and cell elements with native attributes and refs. |
| ToastProvider / useToast | Provider-scoped creation and dismissal, info/success/error variants, timed cleanup, assertive error announcements, and polite non-error announcements. |

## Compatibility and preservation

- React peer support is 18.2 and 19.
- Existing `.td-*` classes and `--td-*` custom properties are retained.
- The package does not alter the approved fonts, themes, density model, or visual language.
- Client-only modules are explicitly marked for Next.js App Router interoperability.

## Verification

- Fifteen React tests pass across P0 and P1 suites.
- Axe critical/serious checks pass with color contrast excluded because jsdom cannot compute the external CSS token cascade.
- The production catalog builds and was interaction-tested in light/comfortable and dark/compact modes.
- Packed tarballs build in clean Vite and Next.js consumers without workspace aliases.

## Deferred boundaries

- Existing Storybook stories remain blocked until the Storybook source is available.
- Formal image baselines and human visual approval are deferred.
- P2 advanced components and other platform adapters are outside P1.
