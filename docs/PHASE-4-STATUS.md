# Phase 4 — React Native and Flutter

Status date: 2026-08-26  
Overall state: **in progress; native tokens and host-side P0 foundations verified**

## Native token layer

- One deterministic generator reads `tokens/source/tokens.json`.
- Generated outputs cover 11 semantic colors in light/dark modes, 13 spacing values, and 10 radii.
- TypeScript output feeds the NativeWind bridge and React Native package.
- Dart output feeds the Flutter ThemeExtension.
- Unsupported CSS runtime expressions are not copied into native outputs.

## React Native / Expo

| Deliverable | State |
|---|---|
| NativeWind theme bridge | Verified TypeScript build |
| TonalDepthProvider light/dark modes | Verified host token test |
| Button, Badge, Card, Input | Verified TypeScript build |
| NativeWind className extension points | Implemented |
| Expo clean consumer | Deferred |
| iOS simulator/device | Deferred |
| Android emulator/device | Deferred |

Current baselines: React Native 0.87.0, Expo 57.0.16, NativeWind 4.2.6. Host compilation is not presented as device verification.

## Flutter

| Deliverable | State |
|---|---|
| Generated Dart tokens | Verified |
| TonalDepth ThemeExtension | Verified |
| Light/dark Material theme bridge | Verified |
| Button, Badge, Card, TextField | Verified host widget tests |
| Static analysis | Verified; no issues |
| Widget tests | Verified; 3/3 pass |
| Catalog application | Deferred |
| iOS/Android device tests | Deferred |

Local toolchain: Flutter 3.44.0 and Dart 3.12.0.

## Boundaries

- Font-role names are prepared, but native font binaries are not claimed packaged until their licenses and static-weight files are verified.
- Storybook is web documentation only and is unrelated to native catalog requirements.
- No native package has been published.
- Phase 4 is not complete until clean Expo/Flutter catalogs and approved simulator/device checks pass.
