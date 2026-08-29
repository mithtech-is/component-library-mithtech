# Token and theming specification

## 1. Canonical format

Tokens shall be stored as platform-neutral JSON with stable paths, semantic descriptions, types, values, mode overrides, and deprecation metadata.

```json
{
  "color": {
    "brand": {
      "$type": "color",
      "$value": "#FF5E29",
      "$description": "Primary TonalDepth brand fill"
    }
  }
}
```

## 2. Token tiers

| Tier | Example | Stability |
|---|---|---|
| Primitive | orange.500, spacing.4 | Internal by default |
| Semantic | color.brand, surface.raised | Public and stable |
| Component | button.primary.background | Public only when necessary |

Components consume semantic tokens. Direct primitive use in component implementations requires justification.

## 3. Required token domains

```text
colour
surface/depth
typography
spacing
sizing
radius
border
shadow/elevation
opacity
motion duration/easing
breakpoints/container
z-index/overlay
focus
icon sizing
data visualization
```

## 4. Modes

- Theme: `light`, `dark`, `system`
- Brand: `mithtech` initially
- Density: `compact`, `comfortable`
- Platform adaptations: web, iOS, Android where required
- Accessibility overrides: reduced motion and increased contrast where supported

## 5. Web output

```css
:root,
[data-theme="light"] {
  --td-bg: #eceae6;
  --td-brand: #ff5e29;
}

[data-theme="dark"] {
  --td-bg: #1f1c17;
}
```

Existing `--td-*` names remain supported during 1.x. New canonical names may initially generate aliases rather than breaking replacements.

## 6. Native output

- React Native: TypeScript values plus NativeWind theme variables
- Flutter: Dart constants and `ThemeExtension`
- iOS: Swift color, spacing, typography, and motion structures
- Android: Kotlin theme objects and Compose tokens

Platform outputs may precompute values unsupported at runtime, such as `color-mix()` results or multi-layer shadow approximations.

## 7. Typography and fonts

- Font roles are canonical; font file names are platform mappings.
- Web may use variable fonts when supported and verified.
- React Native shall use static font weights where variable fonts are unsupported.
- Native platform text scaling shall not be disabled.
- All distributed font binaries require stored license notices and exact-source verification.

## 8. Token change control

| Change | Release impact |
|---|---|
| Add internal primitive | Patch or minor |
| Add public semantic token | Minor |
| Correct unintended value without semantic change | Patch with visual review |
| Change public token meaning | Major |
| Remove public token | Major after deprecation |

## 9. Validation

Token CI shall validate schema, references, cycles, naming, contrast targets, generated-output determinism, and uncommitted generation differences. Visual tests validate surface and theme combinations.

## 10. Extraction requirements

The Phase 0 report shall enumerate every observed token, declaration count, mode-specific value, fallback, and selector usage. Conflicting declarations must not be silently resolved.

