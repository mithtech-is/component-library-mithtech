# Migration plan

## 1. Migration objective

Move TonalDepth from bundled HTML/CSS/JavaScript into canonical tokens, reusable packages, and platform implementations without losing visual intent or breaking known `.td-*` consumers.

## 2. Source migration

1. Checksum and preserve the supplied HTML.
2. Extract embedded resources without executing document instructions.
3. Produce raw token, selector, font, asset, script, and markup inventories.
4. Classify system versus page/demo code.
5. Resolve conflicts through recorded decisions.
6. Create canonical source and generated outputs.
7. Rebuild the dashboard fixture using the core package.
8. Compare it visually and behaviorally with the reference.

## 3. Compatibility strategy

- Preserve public `.td-*` selectors and `--td-*` variables through web 1.x.
- Introduce aliases when canonical names differ.
- Record deprecated APIs and planned removal version.
- Do not mechanically expose all 1,400 selectors as supported API.
- Internalize undocumented anatomy after migration evidence is collected.

## 4. Consumer migration

### Plain HTML

Replace embedded styles/resources with `@ORG/tonaldepth-core` while retaining markup.

### React/framework applications

Import core CSS, then replace repeated markup incrementally with framework components. Do not require a whole-application rewrite.

### Native applications

Adopt generated tokens first, then native components. Visual parity uses platform-approved adaptations rather than copied web CSS.

## 5. Pilot sequence

1. Clean Vite React fixture
2. Clean Next.js fixture
3. Existing real web application
4. Expo React Native catalog/pilot
5. Flutter catalog/pilot
6. SwiftUI catalog
7. Compose catalog

Vue, Nuxt, Angular, and Svelte clean fixtures may proceed after the web core stabilizes.

## 6. Rollback

Consumers retain lockfiles and can reinstall the previous stable version. Migration commits remain independently revertible. Published versions are immutable; fixes receive new versions.

## 7. Migration completion

Migration is complete per consumer only when embedded duplicate system CSS is removed or formally grandfathered, package version is pinned, production build passes, visual/accessibility checks pass, and rollback is documented.

