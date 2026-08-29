# Design-system specification

## 1. Confirmed design language

The supplied artifact establishes a warm, tonal, depth-oriented visual system with semantic surfaces, raised/rest/inset states, vivid papaya brand colour, blue accent, green success, status colours, multiple typography roles, and extensive `td-` component classes.

Confirmed representative tokens include:

```text
--td-bg
--td-surface
--td-surface-2
--td-ink
--td-ink-2
--td-ink-3
--td-brand
--td-brand-deep
--td-accent
--td-green
--td-shadow-dark
--td-shadow-light
--td-raise-fill
```

The extraction audit must produce the definitive token list.

## 2. Design principles

1. Depth communicates state and hierarchy, not decoration alone.
2. Raised controls press inward during interaction where the existing pattern specifies it.
3. Light originates from the top-left; shadows must remain warm on warm surfaces.
4. Brand and status colours use text-safe semantic counterparts.
5. Typography is role-first, with platform-appropriate font availability.
6. Dense operational interfaces remain readable and touch-accessible.
7. Motion communicates transition and respects reduced-motion preferences.

## 3. Surface model

| State | Meaning | Typical use |
|---|---|---|
| Raised | Interactive or emphasized object above base surface | Cards, buttons, panels |
| Rest | Neutral object on the base plane | Static regions, background |
| Inset | Recessed instrument or contained information | Wells, inputs, charts |

Native platforms may approximate multi-shadow depth through platform elevation, layered views, or approved visual substitutions. Semantic state must remain intact.

## 4. Typography roles

The artifact indicates these working roles:

| Role | Working font | Use |
|---|---|---|
| Display | Anton | Large titles and numerals; web floor approximately 20 px |
| UI | Hanken Grotesk in the supplied dashboard artifact | Labels, controls, smaller headings |
| Body | Source Sans 3 in the supplied dashboard artifact | Sentences and descriptive text |
| Mono | JetBrains Mono | IDs, dates, metrics, machine-reported values |

The currently hosted Storybook showed a different UI/body pair in one inspected document. Therefore the exact font-role mapping is **to verify** against the final HTML extraction and chosen baseline before canonicalization.

## 5. Responsive principles

- Layouts must reflow rather than horizontally clip.
- Touch targets remain usable at the minimum supported viewport.
- Dashboard grids collapse progressively.
- Action pairs wrap or stack at narrow widths.
- Typography uses bounded fluid scales on web and native text scaling on mobile.
- Content, not device labels, determines component breakpoints.

## 6. Component specification template

Every public component specification shall include:

```text
Purpose
When to use / not use
Anatomy
Variants
Sizes
States
Content rules
Token mapping
Responsive behavior
Accessibility behavior
Motion
Platform differences
API mapping
Examples
Test cases
Deprecation status
```

## 7. State vocabulary

Where relevant, components define:

```text
default
hover (pointer platforms)
focus-visible
pressed/active
selected
disabled
loading
read-only
error
warning
success
empty
dragging
expanded/collapsed
```

## 8. Content rules

- No real customer or credential data in examples.
- Labels are direct and task-oriented.
- Statuses pair colour with text/icon/shape.
- Components must survive long labels, localization, and empty optional content.
- Application-specific language belongs to examples or compositions, not primitives.

## 9. Visual fidelity policy

The HTML baseline is used for visual comparison, not blindly copied. Deviations are allowed only for accessibility, native-platform convention, unsupported rendering features, or documented correction of an existing defect. Every intentional deviation receives an ADR or component-level note.

