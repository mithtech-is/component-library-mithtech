# Native P0 contracts

Status: **host-side implementation verified; device verification deferred**

## Shared semantics

- Canonical light/dark colors, spacing, and radii come from generated outputs.
- Components expose native disabled, busy, error, label, hint, and live-region semantics.
- Text scaling is not disabled.
- Native platform components are used rather than DOM/CSS emulation.

## React Native exports

- TonalDepthProvider and `createTonalDepthNativeTheme`
- TdNativeButton
- TdNativeBadge
- TdNativeCard
- TdNativeInput

NativeWind `className` and native `style` extension points are supported. React Native components do not import React DOM or web CSS.

## Flutter exports

- TonalDepthTheme ThemeExtension and Material bridge
- TdButton
- TdBadge
- TdCard
- TdTextField

Flutter widgets use immutable typed parameters, Material semantics, and theme lookup through `BuildContext`.
