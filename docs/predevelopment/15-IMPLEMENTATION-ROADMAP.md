# Implementation roadmap

## Gate 0 — Readiness and repository setup

Deliverables:

- Exact GitHub organization namespace
- Private repository and teams
- Maintainers and approvers
- HTML checksum and archived baseline
- Approved version-one web component scope
- Initial package names

Exit: repository and governance are operational.

## Phase 0 — Forensic extraction

- Extract tokens, CSS, fonts, assets, scripts, and template markup
- Build raw inventories
- Identify conflicts and page-only styles
- Verify font-role mapping and licenses
- Produce reference screenshots and extraction report

Exit: canonicalization decisions are approved; no production package claim yet.

## Phase 1 — Canonical foundation

- Token schema and generators
- Core CSS package
- Themes, density, fonts, and icons
- HTML dashboard fixture rebuilt from the package
- Core package private prerelease

Exit: HTML/CSS consumer passes visual and installation checks.

## Phase 2 — React and Next.js

- P0/P1 React components
- Storybook migration
- Vite and Next.js clean consumers
- Accessibility and visual tests
- First real web pilot

Exit: stable web 1.0 criteria met.

## Phase 3 — Vue/Nuxt, Angular, Svelte/SvelteKit

- Framework-native primitive adapters
- Forms/overlay integrations
- SSR fixtures where applicable
- Documentation stories/examples

Exit: each claimed adapter has a clean production build and component-completion evidence.

## Phase 4 — React Native and Flutter

- Native token generation
- NativeWind theme and RN primitives
- Flutter ThemeExtension and widgets
- Native catalogs and device testing

Exit: approved mobile primitives pass accessibility, theme, scaling, and platform visual checks.

## Phase 5 — Native iOS and Android

- Swift package and SwiftUI primitives
- Maven package and Compose primitives
- Native catalogs, accessibility, and snapshot tests

Exit: supported OS/version matrix passes on real or approved test devices.

## Phase 6 — Maturity

- Optional shadcn-style private block registry
- Codemods/migration helpers
- Cross-platform parity dashboard
- Performance budgets and telemetry
- Additional brands and platform-specific patterns

## Delivery rule

Phases may overlap only after canonical tokens and component specifications stabilize. A later platform must not redefine shared semantics without a cross-platform decision record.

