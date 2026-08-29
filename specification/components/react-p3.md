# React P3 page-pattern contracts

Status: **implemented and verified locally**  
Canonical visual source: approved offline TonalDepth HTML

## Included patterns

| Export | Contract |
|---|---|
| DashboardPage | Page heading/actions, optional filter and metric slots, and a responsive bento content region for operations or analytics compositions. |
| DashboardPanel | Labelled dashboard content panel with metadata and one-, two-, or full-width span behavior. |
| DataManagementPage | Page heading/actions, toolbar, consumer-owned data region, and footer/pagination slot. |
| PageState | Empty, loading, and error outcomes with appropriate live-region, busy, and alert semantics plus optional illustration/action slots. |

## Ownership boundaries

- Patterns do not fetch data, navigate, paginate, sort, search, authorize users, or send analytics.
- Charts, tables, metrics, filters, actions, and page data remain consumer-owned.
- DashboardPage supports operations and analytics layouts without imposing a business schema.
- PageState reports state supplied by the consumer; it does not infer request outcomes.
- The internal Vite catalog is a QA fixture, not documentation. Storybook integration remains deferred.

## Verification

- Public TypeScript exports and production build pass.
- Twenty-seven React tests pass across P0-P3.
- Internal browser QA passed in both themes and densities with zero overflow and no browser warnings/errors.
- Packed Vite and Next.js consumers build without workspace aliases; Next emits a static page.
