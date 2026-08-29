# Repository boundaries

The local workspace follows the approved monorepo architecture, but Gate 0/Phase 0 intentionally creates no production component source.

| Boundary | Purpose | Current state |
|---|---|---|
| `apps/` | Storybook and platform catalogs | Deferred |
| `others/specification/` | Component, accessibility, motion, and platform contracts | Prepared directories; content deferred |
| `tokens/` | Canonical source and generated token outputs | Prepared directories; canonicalization blocked |
| `components/packages/` | Web and React Native packages | Deferred |
| `flutter/`, `apple/`, `android/` | Native platform libraries | Deferred |
| `static/examples/` | Clean packed-consumer fixtures | Deferred |
| `tooling/audit/` | Read-only Phase 0 evidence extraction | Verified |
| `static/baselines/` | Immutable source/visual evidence | Verified HTML archive |
| `static/artifacts/phase-0/` | Deterministic generated inventories | Verified |

The root workspace is marked `private: true` to prevent accidental publication. The approved GitHub organization is `Mithtech-Bengaluru`; JavaScript packages will use the lowercase npm scope `@mithtech-bengaluru`. Individual package manifests remain Phase 1 work.
