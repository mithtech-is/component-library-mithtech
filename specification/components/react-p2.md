# React P2 composite contracts

Status: **implemented and verified locally**  
Canonical visual source: approved offline TonalDepth HTML

## Included contracts

| Export | Contract |
|---|---|
| KpiCard / KpiGrid | Server-safe metric composition with label, value, delta/trend treatment, and an optional consumer-owned decorative visualization. |
| FilterBar | Controlled or uncontrolled multi-select filters using toggle buttons, optional counts/colors/disabled state, clear action, and value-change outcome events. |
| DesktopNavigation | Server-safe primary navigation with brand/actions slots, current-page state, disabled display items, and optional sticky behavior. |
| ApplicationShell | Server-safe sidebar and main-content composition with identity/footer/actions slots, grouped links, current-page state, and consumer-owned page content. |
| ChartContainer | Chart-library-neutral figure, caption, metadata, accessible text description, legend, and consumer-owned SVG/canvas/chart output. |

## Boundaries

- Existing `.td-*` classes and `--td-*` variables are preserved.
- P2 supplies composition and accessibility context, not business data, routing, analytics, or a charting dependency.
- Static composites remain server-safe. FilterBar is the isolated client boundary.
- Application content and chart rendering remain consumer-owned.
- P3 dashboard templates are not implied by these composites.

## Verification

- Production build and public TypeScript exports pass.
- Twenty-one React tests pass across P0, P1, and P2.
- The P2 catalog was interaction-tested in both themes and densities with no overflow or browser warnings/errors.
- Clean packed Vite and Next.js consumers build without workspace aliases; Next emits a static page.
- Storybook migration remains blocked until its source becomes available.
