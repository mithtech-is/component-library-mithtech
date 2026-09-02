# TonalDepth Tokens

Two source files drive everything the core package ships:

| File | Owns |
| --- | --- |
| [`source/tokens.json`](source/tokens.json) | Every `--td-*` CSS variable — colour, spacing, radius, depth, motion, and the font-family *stacks* |
| [`source/fonts.json`](source/fonts.json) | Where those font families are *fetched from* — CDNs, subsets, weights |

Edit either, run `pnpm generate`, and `components/packages/core/dist/` is rebuilt along
with the native token map, the registry and the docs props table.

---

## The defaults

### Type, by role

| Token | Family | Role |
| --- | --- | --- |
| `--td-font-display` | **Anton** | Display headings (h1–h3), rectangle titles |
| `--td-font-sans` | **Source Sans 3** | Body copy |
| `--td-font-ui` | **Hanken Grotesk** | UI text: buttons, labels, nav, h4–h6 (600 weight ceiling) |
| `--td-font-mono` | **JetBrains Mono** | Counts, timestamps, command-palette hints |

### Colour

| Token | Light | Dark |
| --- | --- | --- |
| `--td-bg` / `--td-surface` | `#ECEAE6` | `#1A1815` |
| `--td-surface-2` | `#E1DED9` | `#221F1A` |
| `--td-ink` | `#1F1C17` | `#F0EDE5` |
| `--td-ink-2` | `#6E685E` | `#9A9388` |
| `--td-ink-3` | `#9A9388` | `#6E685E` |
| `--td-brand` (papaya) | `#FF5E29` | `#FF5E29` |
| `--td-brand-text` | `var(--td-brand)` | `var(--td-brand)` |
| `--td-accent` (azure) | `#00AAFF` | `#00AAFF` |
| `--td-accent-text` | `#0675B0` | `var(--td-accent)` |
| `--td-green` | `#59D38C` | `#59D38C` |
| `--td-green-text` | `#0C814A` | `var(--td-green)` |
| `--td-error` | `#EC360E` | `#EC360E` |
| `--td-error-text` | `#D92A00` | `#E34D31` |
| `--td-series-1…8` | `oklch(0.66 0.23 <hue>)` at hues 30 / 237 / 160 / 300 / 120 / 190 / 354 / 265 | same |

---

## Change a colour

1. Open [`source/tokens.json`](source/tokens.json), find the entry whose `path`
   matches the token (`color.brand`, `color.bg`, `color.error`…).
2. Edit `$value` for the light value; edit
   `$extensions.tonaldepth.modes.dark` for the dark one.
3. `pnpm generate`, then `pnpm test:core`.

```json
{
  "path": "color.surface",
  "$type": "color",
  "$value": "#F5F5F5",
  "$extensions": {
    "tonaldepth": {
      "cssVariable": "--td-surface",
      "modes": { "dark": "#1A1815" }
    }
  }
}
```

A value may reference another token (`var(--td-brand)`); the build checks that
every referenced variable exists. Keep references as references — flattening
`--td-brand-text` to a hex breaks the one-papaya rule below.

## Change a font

Two edits, and they must agree:

1. **`source/tokens.json`** — the `typography.family.*` entry, so components
   ask for the new family.
2. **`source/fonts.json`** — the matching `families[]` entry, so the new family
   is actually fetched.

`test_font_faces_cover_every_family_token` fails if you change one and forget
the other.

```json
{
  "family": "Hanken Grotesk",
  "token": "--td-font-ui",
  "role": "UI text: buttons, labels, nav, h4-h6",
  "package": "@fontsource-variable/hanken-grotesk@5",
  "slug": "hanken-grotesk",
  "variable": true,
  "weight": "100 900",
  "styles": ["normal", "italic"],
  "subsets": ["latin", "latin-ext"]
}
```

Any font on [Fontsource](https://fontsource.org) works — set `package` and
`slug` to match, and `variable` to whether it is a variable font. File names
follow Fontsource's own convention, which the generator reproduces:

- variable → `{slug}-{subset}-wght-{style}.woff2`
- static → `{slug}-{subset}-{weight}-{style}.woff2`

## Change the glow

Every lamp in the library — `IconButton`, a `Button`'s leading icon, the
`ThemeToggle` — runs one ladder: **off at rest, a soft bloom on hover, a solid
core plus a wide halo on press.** Press must be visibly brighter than hover,
not merely larger; that is what the halo is for.

Three composed tokens hold the whole ladder. Components reference these and
never spell a `drop-shadow` out:

| Token | What it is |
| --- | --- |
| `--td-lamp-off` | Two **explicit zero** shadows — the rest state |
| `--td-lamp-hover` | One soft bloom, plus a zero halo slot |
| `--td-lamp-active` | A solid core **and** a wide halo |

Six knobs feed them. These are what you actually edit:

| Token | Default |
| --- | --- |
| `--td-glow-hover-blur` | `3px` |
| `--td-glow-hover-strength` | `40%` |
| `--td-glow-active-blur` | `5px` |
| `--td-glow-active-strength` | `100%` |
| `--td-glow-active-halo-blur` | `12px` |
| `--td-glow-active-halo-strength` | `60%` |

### Two rules the composition must keep

**Rest is `--td-lamp-off`, never `filter: none`.** Transitioning from `none`
leaves the engine to invent the start value, and it flashes a dark shadow
behind the icon on first hover.

**Every state carries the same number of `drop-shadow()` functions** — two.
A state with a different count snaps instead of interpolating, which is what
made press look identical to hover. That is why hover pads a zero halo it does
not use.

### The lamp's colour

`--td-lamp-glow` is what a lamp lights. It defaults to `--td-green`, is set per
housing (papaya on surface buttons, white on filled, `--td-accent` on
`call`/`email`, WhatsApp green on `whatsapp-quiet`), and can be set per
instance:

```tsx
<Button leading={<BellIcon />} glow="var(--td-series-4)">Notify</Button>
<IconButton icon={<StarIcon />} aria-label="Star" glow="#C79600" />
```

Any CSS colour works. The glow is mixed from it at the strengths above, so a
custom colour still rides the same ladder and still follows the theme.

### Containment

The glow is clipped to its housing (`overflow: hidden` on the button), and it
must **never** be applied to the housing element itself — an element's own
filter cannot be clipped by its own overflow, which is how a 12px bloom used to
paint straight onto the page.

Note `drop-shadow` does not blur the icon. It paints a blurred copy of the
glyph's alpha mask behind it and draws the sharp original on top, so even at
`12px` the mark keeps its edges and its internal detail.

## How fonts load

CDN first, a second CDN next, a self-hosted copy last — as three `src:` entries
on **one** `@font-face`:

```css
src:
  url("https://cdn.jsdelivr.net/npm/@fontsource-variable/hanken-grotesk@5/files/hanken-grotesk-latin-wght-normal.woff2") format("woff2"),
  url("https://unpkg.com/@fontsource-variable/hanken-grotesk@5/files/hanken-grotesk-latin-wght-normal.woff2") format("woff2"),
  url("/fonts/hanken-grotesk-latin-wght-normal.woff2") format("woff2");
```

The browser walks that list and uses the first source that loads, so a blocked
or down CDN costs one failed request instead of a missing face. **This is the
only arrangement that actually fails over** — two `@import`-ed stylesheets are
both fetched and the later one silently shadows the earlier.

Change the CDNs, or the self-hosted directory, at the top of `fonts.json`:

```json
"cdns": ["https://cdn.jsdelivr.net/npm", "https://unpkg.com"],
"selfHostedBase": "/fonts"
```

**To self-host**: copy the Fontsource `.woff2` files into that directory under
the names above. They are the third source already — nothing else to wire.

### Entry points

| Import | Gets |
| --- | --- |
| `@mithtech-bengaluru/tonaldepth-core` | tokens + compat + **fonts** (the default) |
| `@mithtech-bengaluru/tonaldepth-core/no-fonts` | tokens + compat, **zero font requests** |
| `…/fonts.css`, `…/tokens.css`, `…/compat.css` | one layer each |

Use `/no-fonts` when the app supplies the families itself — self-hosted
`@font-face`, `next/font`, or an already-installed system copy. The mith.tech
site does this: it ships its own woff2 and declares its own faces, so it must
not also pull the package's, or every file would be fetched twice and only one
copy used.

## What `modes` does

`$extensions.tonaldepth.modes` holds per-theme (`dark`) and per-density
(`compact`, `comfortable`, `spacious`) overrides. The build emits each as its
own selector, so a token with `modes.dark` gets both a
`@media (prefers-color-scheme: dark)` block — for visitors on `system` — and a
`[data-theme="dark"]` block for the explicit toggle. Theme-invariant tokens
(`--td-brand`, `--td-radius-*`, motion) leave `modes` empty.

## Add a new token

Append to the `tokens` array with `path`, `$type`, `$value`, `$description`,
and `$extensions.tonaldepth.cssVariable`. The variable must match
`--td-[a-z0-9-]+`. Duplicate paths, duplicate variables, and `var()` references
to a variable that does not exist each fail validation immediately.

## Icons — Phosphor, and only Phosphor

Every UI icon in the system comes from [Phosphor](https://phosphoricons.com),
imported through one module: `components/packages/react/src/icons.ts`. Nothing in the
library draws its own `<svg>` path.

**Do not add a second icon library** — not Lucide, Heroicons, Font Awesome,
react-icons, or an emoji standing in for a glyph. The only exception is artwork
that is not an icon: a company logo, a product mark, a diagram. Those are
passed in as a prop by the consuming app, never added to the icon set.

### Weight

`fill` is the house weight, and it is not a preference. The lamp pattern
([[L15]]) makes an icon carry a control's whole state through its colour and a
`drop-shadow` glow — and a glow traces the **alpha edge** of what it lights. An
outline glyph glows as a hollow outline and reads as a smudge; a solid mark
glows as a solid mark. Every icon rendered inside a component carries
`weight={LAMP_WEIGHT}`, and a test asserts it.

### Sizing and colour

Icons take their size from the type beside them (`1em`) and their colour from
the component (`currentColor`), which is what lets a lamp's ramp move them
without the icon knowing. **Never set a pixel size or a literal colour on an
icon inside a component** — set the font size or the colour on the element that
owns it.

### Adding one

Import the Phosphor component in `icons.ts`, re-export it under a **role** name
(`AcceptIcon`, not `CheckIcon`), and use the role name everywhere. The
indirection is the point: a component says what the icon is *for*, so swapping
a glyph is one line in one file instead of a search across the package.

Four tests hold this: no raw `<svg>` in a component, no second icon library in
any import, no component importing `@phosphor-icons/react` directly, and every
rendered icon at `fill` weight.

### For registry consumers

`@phosphor-icons/react` is the registry's **one** npm dependency, declared on
each item that needs it. The generator rewrites the package's `./icons` import
into a direct Phosphor import with the same role aliases, so a copied item
stays a single self-contained file.

## One papaya, both themes — L01

`--td-brand-text` and `--td-warning-text` resolve to `var(--td-brand)`
(`#FF5E29`) in **both** modes. Manoj's standing rule
([`_LEARNINGS.md` L01][L01]) rejects the darker `#CA3E04` that older sources
substitute in light mode for contrast.

Accepted cost: `#FF5E29` on the light ground is ~3.0:1 — fine for large text
and UI boundaries, below AA for body-size text. **Keep papaya off small body
copy in light mode** rather than reverting the rule. If you are reaching for
`#CA3E04` or `var(--td-brand-deep)` for a text role, re-read L01 first.

[L01]: ../../Mithtech-payload/page-creation/_LEARNINGS.md
