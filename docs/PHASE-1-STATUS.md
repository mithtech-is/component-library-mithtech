# Phase 1 — Canonical foundation status

Status date: 2026-08-26

## Outcome

Phase 1 is **implemented and locally verified**, with private registry publication, font binaries, icon source, chart runtime, and formal visual approval still deferred or blocked as listed below.

## Delivery evidence

| Requirement | State | Evidence |
|---|---|---|
| Canonical token schema | Verified | `tokens/schema/tokens.schema.json`; custom validation checks required fields, unique paths/variables, naming, and references. |
| Canonical token source | Verified | `tokens/source/tokens.json`; 115 declarations imported from the approved offline HTML. |
| Deterministic generators | Verified | Consecutive builds produce identical hashes; covered by automated tests. |
| Light/dark/system themes | Verified | Generated `tokens.css`; browser read-back confirmed light `#ECEAE6` and dark `#1A1815`. |
| Density modes | Verified | Compact `0.75`, comfortable `1`, spacious `1.35`; light/comfortable and dark/compact rendered. |
| Web 1.x compatibility | Verified | Generated compatibility CSS contains 1,412 actual `.td-*` CSS class names. The Phase 0 count of 1,413 includes one comment-only reference, `.td-hero-visual`. |
| Core package | Verified locally | `@mithtech-bengaluru/tonaldepth-core@0.1.0-alpha.0`; seven-file allowlist. |
| Packed consumer | Verified | Automated `npm pack`, clean temporary install, and installed-file reconciliation pass. |
| Package-backed HTML smoke fixture | Verified | Light/comfortable and dark/compact browser checks; no console warnings/errors. |
| Package-backed dashboard fixture | Partially verified | Approved dashboard markup renders package CSS with 64 `td-` elements, four KPIs, no horizontal overflow, and no console warnings/errors. Charts are blank because bundled application JavaScript is not part of the core CSS package. |
| Font-family roles | Verified | Canonical family tokens follow the owner-approved offline HTML. |
| Font binaries | Blocked | Excluded until Google Fonts licenses/provenance map to audited hashes; package makes no font network requests. |
| Icons | Deferred | Sizing/stroke tokens are canonical; reusable SVG source extraction/classification is not yet approved. |
| Private prerelease publication | Prepared | Package metadata targets GitHub Packages with restricted access; remote repository and credentials do not exist locally. |

## Automated verification

Seven tests pass:

1. Canonical schema and legacy variable coverage.
2. Theme and density modes.
3. Deterministic generation.
4. No font-network requests or packaged `@font-face` rules.
5. Compatibility selectors.
6. Package-backed dashboard fixture structure.
7. Packed clean-consumer installation and exact package allowlist.

## Boundaries

- No React, Vue, Angular, Svelte, React Native, Flutter, SwiftUI, or Compose component is claimed.
- Existing Storybook has not yet been migrated to package source.
- The package is packed and installed locally, not published to GitHub Packages.
- No font or icon redistribution claim is made.
- The dashboard chart runtime remains application/example behavior and is not included in core.

