# Architecture and product decision log

| ID | Decision | Status | Rationale |
|---|---|---|---|
| ADR-001 | Reconstruct from the supplied offline HTML | Approved | It is the only available implementation artifact |
| ADR-002 | Repository becomes the source of truth after canonicalization | Approved | Enables versioning, testing, and maintenance |
| ADR-003 | Use canonical platform-neutral tokens | Approved | Required for web and native consistency |
| ADR-004 | Preserve `.td-*` and `--td-*` through web 1.x | Approved | Reduces migration risk |
| ADR-005 | Use private GitHub Packages for npm packages | Approved default | Organization already uses GitHub; lowest initial operational burden |
| ADR-006 | Keep existing Storybook for web documentation | Approved | Avoids rebuilding an existing docs surface |
| ADR-007 | Protect documentation with identity-aware access | Approved default | Private design system should not be anonymously visible |
| ADR-008 | React package also serves Next.js | Approved | Next.js is a React framework; avoid duplicate implementation |
| ADR-009 | Vue package also serves Nuxt | Approved | Optional Nuxt configuration module only if needed |
| ADR-010 | Svelte package also serves SvelteKit | Approved | Avoid duplicate implementation |
| ADR-011 | Use NativeWind plus native components for React Native | Approved | Provides utility ergonomics without treating CSS as native runtime |
| ADR-012 | Use ThemeExtension and typed widgets for Flutter | Approved | Idiomatic native Flutter API |
| ADR-013 | Use SwiftUI-first and Compose-first native libraries | Approved | Modern native implementation with optional legacy adapters |
| ADR-014 | Stable primitives use packages; shadcn registry is deferred to editable blocks | Approved | Packages provide controlled updates; copied code does not |
| ADR-015 | Deliver platforms in phases | Approved | Prevents total scope from blocking web foundation |
| ADR-016 | Exact font-role mapping is a Phase 0 decision | Open | HTML and inspected Storybook evidence differ |
| ADR-017 | Exact organization namespace | Open configuration | Must match lowercase GitHub organization handle |
| ADR-018 | Minimum supported framework/OS versions | Open configuration | Must be chosen against pilot environments at implementation time |
| ADR-019 | Initial real pilot repositories | Open configuration | Requires organization selection |

New material decisions use an ADR with context, options, decision, consequences, owner, and date.

