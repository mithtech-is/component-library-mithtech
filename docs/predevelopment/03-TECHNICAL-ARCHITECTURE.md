# Technical architecture

## 1. Architectural approach

TonalDepth uses a specification-first, adapter-based architecture. Canonical tokens and component contracts are shared; rendering and behavior are implemented natively for each platform.

```text
Claude HTML extraction baseline
              ↓
Canonical tokens + component specifications
              ↓
Generators and validators
              ↓
┌─────────────┼──────────────┬──────────────┐
Web adapters  Cross-platform mobile        Native mobile
CSS/React/    React Native/Flutter          SwiftUI/Compose
Vue/Angular/
Svelte
              ↓
Private packages + versioned documentation
              ↓
Consumer projects and controlled upgrade PRs
```

## 2. Proposed monorepo

```text
tonaldepth/
├── apps/
│   ├── storybook/
│   ├── mobile-catalog/
│   ├── flutter-catalog/
│   ├── ios-catalog/
│   └── android-catalog/
├── specification/
│   ├── components/
│   ├── accessibility/
│   ├── motion/
│   └── platform-mapping/
├── tokens/
│   ├── source/
│   └── generated/
├── packages/
│   ├── core/
│   ├── react/
│   ├── vue/
│   ├── angular/
│   ├── svelte/
│   ├── nativewind/
│   ├── react-native/
│   └── icons/
├── flutter/tonaldepth_flutter/
├── apple/TonalDepth/
├── android/tonaldepth/
├── examples/
└── tooling/
```

Separate repositories may be introduced for Apple/Android if their build infrastructure or permissions require it; canonical token source and specifications remain controlled by the main repository.

## 3. Source layers

### Canonical inputs

- Token JSON
- Component specifications
- Icon source SVGs
- Font binaries and license notices
- Platform mapping rules

### Generated outputs

- CSS custom properties and theme blocks
- TypeScript constants/types
- NativeWind theme values
- Dart theme data
- Swift token structures
- Kotlin token objects

Generated outputs include a banner and are checked into source only when required by consumer tooling. CI verifies regeneration produces no diff.

## 4. Package boundaries

| Package | May depend on | Must not depend on |
|---|---|---|
| core | Token outputs, assets | React, charts, application code |
| react | core, selected accessible primitives | Next.js, application routing |
| vue | core, selected Vue primitives | Nuxt runtime unless optional adapter |
| angular | core, Angular CDK | Consumer modules/business services |
| svelte | core | SvelteKit runtime unless adapter |
| nativewind | tokens, NativeWind peer | React DOM/CSS browser APIs |
| react-native | tokens/nativewind, RN peers | DOM, web-only CSS |
| charts | tokens, chart peer | Core primitive packages |

## 5. Platform adapters

- React/Next.js share the React implementation.
- Vue/Nuxt share the Vue implementation; an optional Nuxt module configures CSS and imports.
- Svelte/SvelteKit share the Svelte implementation.
- Angular uses standalone components and Angular CDK.
- React Native uses NativeWind plus native components.
- Flutter uses ThemeExtension and typed widgets.
- iOS uses Swift Package Manager and SwiftUI-first components.
- Android uses Maven distribution and Compose-first components.

## 6. Extraction architecture

The supplied HTML is never edited into production directly. A repeatable extraction tool shall:

1. Record source checksum and metadata.
2. Extract embedded template/resources.
3. Extract and classify fonts.
4. Parse `--td-*` declarations and theme overrides.
5. Parse `.td-*` selectors and group candidate components.
6. Separate page-shell/dashboard-only styles.
7. Create an extraction report with unresolved conflicts.
8. Produce a visual baseline page for comparison.

Human review promotes cleaned output into canonical source.

## 7. Dependency policy

- Dependencies are added per component need, not convenience.
- Framework runtimes are peer dependencies.
- Charting is optional.
- Accessible primitive libraries are used only within their matching framework adapter.
- No package may import consumer application aliases.
- No cross-platform package may import another platform's rendering runtime.

## 8. Theme runtime

Web uses `data-theme`, `data-brand`, and `data-density`. React Native uses a TonalDepth provider and NativeWind variables. Flutter, SwiftUI, and Compose use native theme/environment mechanisms. All consume semantically equivalent generated values.

## 9. Architecture validation

Each adapter must have a minimal clean consumer. CI builds those consumers from packed artifacts, not workspace source aliases, to validate real installation behavior.

