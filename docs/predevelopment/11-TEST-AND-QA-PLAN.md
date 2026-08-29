# Test and QA plan

## 1. Test levels

| Level | Purpose |
|---|---|
| Token validation | Schema, references, deterministic output |
| Unit | Component state and API behavior |
| Accessibility | Automated rules plus semantic assertions |
| Interaction | Keyboard, touch, focus, gestures |
| Visual regression | Themes, density, states, responsive sizes |
| Package | Exports, file contents, peer dependencies |
| Consumer smoke | Real install and production build |
| Native integration | Device/emulator behavior and platform accessibility |

## 2. Required web matrix

- Clean HTML/CSS fixture
- Vite React production build
- Next.js App Router production build
- Vue and Nuxt production builds
- Angular production build
- Svelte and SvelteKit production builds
- Current supported Chrome, Edge, Firefox, Safari, iOS Safari, and Android Chrome matrix recorded before 1.0

## 3. Native matrix

- React Native: approved Expo and bare RN samples, iOS simulator/device, Android emulator/device
- Flutter: iOS and Android catalog builds plus golden tests
- iOS: supported minimum and latest iOS, Dynamic Type, VoiceOver
- Android: supported minimum and latest API targets, TalkBack and scaling

## 4. Visual baseline

The offline HTML provides initial reference captures. Stable package baselines supersede it after approval. Required combinations include light/dark, compact/comfortable, key interaction states, narrow/medium/wide widths, long content, empty content, and large text.

## 5. Component completion criteria

A component is complete only when production implementation, public types, specification, documentation/catalog, unit tests, accessibility tests, visual baselines, and packed-consumer smoke evidence exist for its claimed platform.

## 6. Release blocking

The following block stable release:

- Compilation or package-build failure
- Clean-consumer installation failure
- Critical/serious accessibility issue
- Unreviewed visual regression
- Secret or prohibited file in package
- Missing license notice for distributed assets
- Unresolved public API conflict
- Failed rollback rehearsal for a major release

## 7. Defect evidence

Defects record environment, version, reproduction, expected/actual behavior, severity, affected platforms, screenshot/log where appropriate, owner, fix version, and verification result.

