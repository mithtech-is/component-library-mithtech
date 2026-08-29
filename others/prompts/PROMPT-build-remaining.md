# Build session — the remaining components

Start inside the library:

```bash
claude
```

Paste everything below the line.

---

Build the components listed under **What to build**, in that order.

**Do not ask me to confirm anything.** Do not stop between components to
report, do not ask which one to do next, do not ask whether to publish. Build,
verify, move to the next. Report once at the end. If something is genuinely
ambiguous, pick the option that matches the design system's existing grammar,
write down the assumption in the component's own comments, and keep going.

**Do not publish.** Bump nothing. `packages/react` is already at
`0.1.0-alpha.19` and unpublished; leave it there.

## Node

```bash
source ~/.nvm/nvm.sh && nvm use 24
```

pnpm 11.9.0 needs Node ≥ 22.13. The shell defaults to v20 and pnpm dies with
`ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite`.

## Read first

1. `../Mithtech-payload/page-creation/_LEARNINGS.md` — L01–L34. **This wins**
   over anything else. L11 (never fill with brand), L18 (interpolable ladders),
   L20 (named light, never `transparent`), L27 (all four sides, light mode),
   L28 (lamp is 1.5× the label), L31 (a Doc entry owes the whole API), L32
   (data recessed, chrome raised), L33 (build from the design it is a component
   *of*), L34 (rows press, they do not tint) are the ones you will touch.
2. `../Mithtech-payload/page-creation/_STATUS.md` — the gap list and the
   upstream issue log.
3. The design for each component, in
   `../Mithtech-payload/docs/tonaldepth/components/<group>/<name>.html`, and
   its CSS family in `../Mithtech-payload/src/styles/tonaldepth.css`.

## What to build

In this order. The number is how many of the 34 briefs the component unblocks.

1. **`12-extras/fileTree`** (4) — `FileTree`. A repo/docs tree. Rows press
   ([[L34]]); the expand chevron is a direction mark, not a lamp.
2. **`10-marketing/pricing`** (4) — `PricingTable`. **First decide** whether
   this is a new component or `ComparisonTable` with a price row. Look at both
   before writing anything. If it is `ComparisonTable`, say so and move on.
3. **`02-typography/codeblock`** (3) — `CodeBlock`. Carved well, mono, a
   `CopyChip` in the corner. **Do not add a highlighting dependency** — take
   pre-highlighted markup as children, and say so in the docs.
4. **`06-navigation/breadcrumbs`** (2) — `Breadcrumbs`. Three separator forms
   exist in the HTML (`bcChevron`, `bcSlash`, `bcCondensed`); make that a
   `separator` prop rather than three components.
5. **`06-navigation/pagination`** (2) — `Pagination`.
6. **`09-interaction/roadmap`** (2) — `Roadmap`. Check `Timeline` first; if it
   is Timeline with a different axis, add the axis to Timeline instead.
7. **`02-typography/map`** (3) — `Map`. Static, no tile provider, no network.

**Three of these are probably not new components.** Check before building, and
if the existing one covers it, extend that instead and record the decision:

- `10-marketing/services` → almost certainly `FeatureCard`. Do not build a
  second card shape.
- `09-interaction/disclose` → almost certainly `Faq` without the list. Likely a
  prop on Faq, not a component.
- `10-marketing/team` and `05-cards/profile` → the same person card. Build one,
  named `ProfileCard`, and use it for both.

## How a component is done

A component is not finished until all seven exist. Three tests enforce parts of
this and will fail if you skip them.

1. **`packages/react/src/<name>.tsx` + `<name>.css`** — the only place you
   author a component. Plain CSS, no Tailwind, every value from a `--td-*`
   token. The `.tsx` imports its own `.css`.
2. **Wire it in five places** — miss one and `pnpm test:core` fails:
   - `packages/react/src/index.ts` — `export * from "./<name>";`
   - `tooling/registry/generate.mjs` — an `ITEMS` entry
   - `tooling/docs/props.mjs` — a `TABLES` entry
   - `registry.json` — an item; add `"dependencies": ["@phosphor-icons/react"]`
     **only if** the generated registry `.tsx` actually imports it
   - `apps/docs/src/main.tsx` — the import, and the `Doc` entry
3. **`pnpm registry:generate`** — writes the registry `.tsx`. Never hand-edit
   those; they are regenerated and your edit is lost.
4. **`registry/tonaldepth/<name>.css`** — hand-authored and **self-contained**.
   A registry consumer has no `tonaldepth-core`, so this file re-declares every
   base class the package inherits. Usually the package file renamespaced
   `td-react-` → `td-registry-`; if the component rides a core base class, that
   base has to be declared here too.
5. **The `Doc` entry** — `summary`, a runnable `code` sample, `options`,
   `notes`, `preview`. `options` expands every choice prop into its values and
   says what each is for. `notes` carries what the component does **not** do,
   what the caller still owes it, and which prop wins when two disagree. This
   half is the documentation; the generated props table is not ([[L31]]).
6. **Tests** in `packages/react/src/p4-components.test.tsx` — the contract, the
   thing it deliberately does not do, and the design-law rule it was built
   against.
7. **Verify** (all of it, every time):

```bash
pnpm generate && pnpm test:core && pnpm test:react && pnpm build:react
cd apps/docs && npx tsc --noEmit && cd ../..
pnpm test:react-consumers
```

## Traps that cost me time — read these

- **`pnpm build:docs` does not typecheck.** A `Doc` entry naming a component
  you forgot to import builds clean and throws `ReferenceError` in the browser.
  Run `cd apps/docs && npx tsc --noEmit` every time.
- **The docs typecheck against `packages/react/dist`.** After changing a prop
  type, run `pnpm build:react` before the docs typecheck or you will chase a
  stale error.
- **A `<tr>` under `border-collapse: collapse` never paints a `box-shadow`.**
  Row depth needs `border-collapse: separate; border-spacing: 0`. A test
  catches it now.
- **Every rung of a ladder needs the same number and shape of shadow slots**,
  in the same order, with unused ones at the shadow's own colour at zero alpha
  — never `transparent`, never `none`. `depth.test.tsx` catches it.
- **A quoted phrase in a `//` comment used to read as an npm import** in the
  registry dependency scanner. Fixed, but keep comments plain.
- **Do not put a shadow on a rung that changes its slot count** — e.g. adding a
  focus ring as an extra slot. Use `outline` for focus, or declare the ring
  unlit in every rung.
- **`width: fit-content`** on any inline-flex control, or a grid/flex parent
  stretches it to the whole track.
- Anything with `overflow-x` inside a flex container needs `min-width: 0`.

## The design law, in one paragraph

Depth is state, colour is category. A boundary is a carved seam, never a tinted
band. Never fill with the brand colour. Rows press, they do not tint. Chrome is
raised, data is recessed — anything with its own plate drops it inside a well.
Every raised element must read on all four sides in **light** mode: the shade,
the highlight, *and* the `0 0 0 1px var(--td-edge)` ring — and the highlight is
never stronger or wider than the shade it answers. Dark is the canonical look,
but light is the mode that catches a weak recipe. Icons are filled, and an
icon+label control draws its glyph at 1.5× the label.

## When you are done

Report once: what you built, what you decided was not a new component and why,
what each one deliberately does not do, and the final numbers from the
verification block. Then update
`../Mithtech-payload/page-creation/_STATUS.md` — the inventory line, the gap
table, and an issue-log row per component. Add to `_LEARNINGS.md` **only** if
Manoj gave a correction during the session; never seed it with your own
conclusions.
