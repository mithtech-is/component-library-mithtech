# Component API standards

## 1. Cross-platform principles

- APIs express purpose and state, not visual implementation details.
- Names are aligned across platforms where idiomatic.
- Platform conventions take priority over artificial signature parity.
- Required behavior is separated from optional styling extension.
- Components remain application-logic neutral.

## 2. Common semantic vocabulary

```text
variant: primary | secondary | outline | ghost | destructive
size: sm | md | lg
density: inherit | compact | comfortable
loading
disabled
selected
invalid
readOnly
```

Only applicable values are exposed by each component.

## 3. React standards

- TypeScript public types
- Appropriate native DOM attribute extension
- Ref forwarding
- `className` and `style` where safe
- `asChild` only where composition benefits justify it
- Controlled/uncontrolled patterns for stateful controls
- Static components contain no `use client` directive
- Interactive modules isolate client boundaries

```tsx
<Button variant="primary" size="md" loading={saving}>
  Save changes
</Button>
```

## 4. Vue standards

- Vue 3 Composition API
- Typed props and emits
- `v-model` for value controls
- Attribute inheritance and named slots
- No Nuxt dependency in the core Vue package

```vue
<TdInput v-model="email" :invalid="Boolean(error)" />
```

## 5. Angular standards

- Standalone components
- Strict typing
- Inputs/outputs or signals according to approved minimum version
- `ControlValueAccessor` for form controls
- Content projection
- Angular CDK for focus, overlay, and accessibility behavior

```html
<td-button variant="primary" [loading]="saving" (pressed)="save()">
  Save changes
</td-button>
```

## 6. Svelte standards

- TypeScript
- Idiomatic event handling and bindable values for the approved Svelte version
- Snippets/slots according to version support
- Attribute forwarding
- No SvelteKit dependency in core components

## 7. React Native standards

- Native elements (`Pressable`, `Text`, `View`, inputs)
- `className` extension through NativeWind
- `style` override where safe
- Accessibility role/state/value mapping
- Expo and bare React Native compatibility after validation
- Web-only DOM props are not exposed

## 8. Flutter standards

- Immutable typed widgets
- Named parameters
- ThemeExtension tokens
- `Semantics`
- Null callbacks follow native disabled convention where appropriate
- Widget composition rather than string-based style APIs

## 9. Swift standards

- SwiftUI-first value types
- Environment-driven theme
- Clear initializers and trailing closure actions
- Dynamic Type and accessibility modifiers
- UIKit adapters only when required by a real consumer

## 10. Kotlin standards

- Compose-first `@Composable` functions
- `Modifier` parameter
- Theme composition locals
- State hoisting
- Material interoperability without leaking business themes
- Android Views adapters only when required

## 11. Events and state

Events describe outcomes (`onValueChange`, `onOpenChange`, `pressed`) rather than low-level implementation events. Components shall not update remote state directly. Async loading remains controlled by the consumer.

## 12. Styling extension policy

Extension hooks must not allow accidental invalidation of accessibility-critical layout without documentation. Component anatomy classes/slots are stable only when explicitly documented as public.

## 13. Deprecation

Deprecated APIs remain functional through the announced removal version, produce development guidance where practical, and include a migration example. Public API removal requires a major release.

