# React P0 component specification

Status: implemented locally in `@mithtech-bengaluru/tonaldepth-react@0.1.0-alpha.0`; existing Storybook documentation pending source access.

## Button

- Native element: `button`; default `type="button"` prevents accidental form submission.
- Variants: primary, secondary, outline, ghost, destructive.
- Sizes: sm, md, lg.
- Loading is consumer-controlled, exposes `aria-busy`, substitutes a text label, and disables activation.
- Native button attributes, `className`, `style`, events, and refs are forwarded.
- Legacy classes: `td-coloured` and `td-primary` with additive React modifier classes.

## Badge

- Native element: `span`.
- Variants: neutral, brand, success, accent, danger.
- Content remains consumer-defined; no status role is added implicitly.
- Native span attributes and refs are forwarded.
- Legacy class: `td-badge` and existing colour modifiers.

## Card

- Native element: `div`; consumers may add an appropriate landmark/ARIA role when content requires it.
- Depth: raised, flat, inset.
- Composition exports: Card, CardHeader, CardTitle, CardContent.
- Native div/heading attributes and refs are forwarded.
- Legacy classes: `td-panel`, `td-panel-head`, `td-panel-title`.

## Input and Textarea

- Native input/textarea elements inside existing TonalDepth visual wrappers.
- Invalid state exposes `aria-invalid` and the existing error-ring styling.
- Disabled state is forwarded to the native control and wrapper.
- Leading decoration is hidden from accessibility APIs by default; trailing content remains readable.
- Native attributes, controlled/uncontrolled value APIs, events, and refs are forwarded.

## FormField

- Connects label and control using a consumer ID or server-safe React `useId` value.
- Connects helper/error messages with `aria-describedby`.
- Errors use `role="alert"` and set `aria-invalid` on the control.
- Required state is forwarded to the control; the visible asterisk is decorative.
- FormField owns no remote or async state.

## Completion boundary

Production source, types, local catalog, behavioral tests, automated semantic checks, rendered states, and packed Vite/Next consumers exist. These components are **not stable/complete under the project-wide definition** until the existing Storybook consumes package source and visual baselines receive approval.

