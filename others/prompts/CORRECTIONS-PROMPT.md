# Corrections session — TonalDepth component library

Start the session **inside the library repo**:

```bash
cd /Volumes/Extreme-SSD/Coding/tonaldepth && claude
```

Then paste everything below the line.

---

You are taking corrections on the **TonalDepth component library**. I will give
them to you **one at a time**. Do not ask for the next one — apply the one you
have, show me the result, and wait.

## Where you are

`/Volumes/Extreme-SSD/Coding/tonaldepth` — the library, and the repo you are in.
It has **no git remote**, which is why publishing needs `--no-git-checks`.

```
components/packages/react/src/     the npm package — THE ONLY PLACE YOU EDIT A COMPONENT
components/packages/core/          tokens.css + compat.css (11,793 lines of approved .td-* rules)
components/registry/tonaldepth/    GENERATED .tsx (hand-authored .css) — shadcn copy-to-source
apps/docs/src/          GENERATED props.generated.json; hand-authored main.tsx
registry.json           the registry manifest — one entry per component
```

**Edit the package. Then run `pnpm generate`.** As of 2026-08-27 the registry's
`.tsx` files and the docs' props tables are generated from
`components/packages/react/src/`, so a hand edit to either is silently reverted on the next
run. Three tests enforce it and will fail the moment the tree goes stale.

Two things are still authored by hand, deliberately:

- **`components/registry/tonaldepth/*.css`** — registry stylesheets are self-contained
  (they re-declare the design system's base rules, because a registry consumer
  has no `tonaldepth-core` to inherit from) while the package's carry only the
  deltas over that core. Different content by design.
- **The editorial half of a `Doc` entry** in `apps/docs/src/main.tsx` — the
  summary, the code sample and the live preview. A person decides what a
  component is for; generating that produces worse docs, not fewer.

The consumer is `/Volumes/Extreme-SSD/Coding/Mithtech-payload` — the mith.tech
marketing site. You may read and edit it, but see the hazards below first.
**Never write files at `/Volumes/Extreme-SSD/Coding` itself** — the workspace
root is a container, not a project.

## See it before you change it

```bash
source ~/.nvm/nvm.sh && nvm use 24
pnpm dev:docs          # http://localhost:4176 — all 28 components, live, with a dark toggle
```

That docs site is the component index, and its previews are the real components
— it imports the workspace package, so what you see is what a consumer gets.
`pnpm dev:docs` runs `pnpm generate` first, so it is always current.

## Read before the first correction

The design law and the standing rules live in the consumer repo, because that is
where they were written down:

1. `../Mithtech-payload/page-creation/_LEARNINGS.md` — 16 standing rules from
   real corrections. **This wins** where anything else disagrees.
2. `../Mithtech-payload/page-creation/_COMMON.md` §1–§2 — the design law.
3. `../Mithtech-payload/page-creation/_LIBRARY.md` — the API, the CSS-overlap
   analysis, and four entries marked **CORRECTION** from the last pass.
4. `../Mithtech-payload/page-creation/_STATUS.md` — the gap list and the
   **Upstream issue log**.

## Where things stand

`@mithtech-bengaluru/tonaldepth-react@0.1.0-alpha.7`, published to
`https://npm.po5.in` and installed in the site.

**28 components in three groups:**

- **Components (19)** — button, badge, card, input, textarea, form-field,
  checkbox, radio, switch, alert, tooltip, tabs, table, dialog, dropdown-menu,
  toast, chart-container, filter-bar, plus the `feedback` demo
- **Patterns (5)** — form controls, kpi, desktop-navigation, application-shell,
  page-patterns
- **Marketing (6)** — `CaseCard`+`CaseCardGrid`, `FeatureCard`+`FeatureGrid`,
  `ComparisonTable`, `CtaBanner`, `Timeline`, `Prose`

The marketing six were added 2026-08-27 and use a `.td-mk-*` namespace that
collides with nothing. The application kit layers `.td-react-*` /
`.td-registry-*` modifiers over the design system's own `.td-*` base classes.

One page is rebuilt on the library: the site's `/contact`. Six things on it were
deliberately **not** moved to library components, because doing so would have
redesigned a signed-off composition — the facts rail, `.td-chip`, `RectTitle`,
`PhoneField`, the two linkcell blocks, the channel tiles. Each is annotated in
place in the source with the reason.

## The correction loop

For each correction I give you:

1. **Place it.** A correction to how a *component* looks or behaves is a library
   change. Only a correction to a page's copy, composition or content is a page
   change. When in doubt, ask.
2. **Fix it in `components/packages/react/src/`, then run `pnpm generate`.** That
   regenerates the registry `.tsx`, the docs props table and the registry JSON.
   If the component is new, add it to `ITEMS` in
   `tooling/registry/generate.mjs`, to `TABLES` in `tooling/docs/props.mjs`, to
   `registry.json`, and write its `Doc` entry and registry `.css` by hand.
3. **Add or update a test** in `components/packages/react/src/*.test.tsx` that would have
   caught it.
4. **Publish, consume, and look at it.**
5. **Record it.** If the correction came from Manoj and states a standing rule
   rather than a one-off bug, add an entry to
   `../Mithtech-payload/page-creation/_LEARNINGS.md` in that file's format —
   date, the correction verbatim, the rule. Never seed that file with guesses;
   only real corrections go in it. Plain bug fixes go in `_STATUS.md`'s Upstream
   issue log instead.

### Node version — fix before touching pnpm

pnpm 11.9.0 needs Node ≥ 22.13. The shell defaults to v20.20.2 and pnpm dies
with `ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite`.

```bash
source ~/.nvm/nvm.sh && nvm use 24
```

### Release loop

```bash
# library — you are already here
pnpm generate                                  # registry .tsx + docs props + registry JSON
pnpm build:react && pnpm test:react && pnpm test:core
pnpm --filter @mithtech-bengaluru/tonaldepth-react publish --no-git-checks

# consumer
cd ../Mithtech-payload
npm install @mithtech-bengaluru/tonaldepth-react@latest
npm run build && npx tsc --noEmit
```

Bump the version in `components/packages/react/package.json` on **every** publish —
Verdaccio rejects a duplicate.

`pnpm test:core` is not optional any more. Alongside the token pipeline it holds
the seven parity tests that keep the four artefacts in step — including two that
re-run the generators with `--check` and fail if the tree is stale.

One more suite, worth running when you change markup or a class contract:

```bash
pnpm test:react-consumers   # builds the two example apps against the fresh tarball
```

### Verification

**A green build is not the bar. Look at it** — 1440px and 390px, both themes.
Chrome's minimum window width is ~500px, so 390 cannot be reached by resizing;
render the page in a 390px-wide iframe instead and the media queries evaluate
correctly.

## Component standards

- A `.tsx` plus a sibling `.css` the component imports. **No Tailwind** — plain
  CSS only, and every value comes from a `--td-*` token.
- Satisfy the design law: depth is state, colour is category, the four-step
  ladder, light lift, carved seams not colour bands, monospace for machine
  values only. Icon+label buttons are lamps ([[L15]]) — the icon carries the
  glow, the label's colour never moves.
- Both themes. **Dark is the default** ([[L02]]) and the one to judge by.
- Every raised element must read on all four sides in light mode — the shade,
  the highlight, *and* the `0 0 0 1px var(--td-edge)` ring.
- New marketing components go in `.td-mk-*`. Do not add new names to the
  `.td-*` classes `components/packages/core` already owns.

## Four hazards

**1. Specificity, not just source order.** The consumer site raises some of its
own rules above the library's:

```css
:root[data-theme="dark"] .td-primary { … }   /* (0,3,0) */
```

A bare `.td-react-*` modifier at (0,1,0) loses to that in dark mode — which is
how `Button variant="ghost"` shipped inert. Any modifier over a base class the
site also owns must be written at **(0,3,0)**. Nine other site rules carry the
same prefix; `_LIBRARY.md` §5 lists them.

Ordering itself is settled and measured: on Next.js 16 / Turbopack, component
CSS imported from `node_modules` lands **after** the consumer's global
stylesheet, so an equal-specificity tie goes to the library.

**2. `@tonaldepth/tokens` must never be installed into the site.** It targets
`styles/tonaldepth.css` — the exact path of the site's own 11,525-line
stylesheet — and would overwrite it. `--td-btn-h` and `--td-btn-h-lg` are
already added there by hand.

**3. The consumer's branch is shared.** Other sessions work
`feat/tonaldepth-current`. Stage only your own paths — **never `git add -A`** —
and confirm which repo you are committing to. Note that `page-creation/`,
`src/styles/marketing.css` and both `/tonaldepth-proof` pages are currently
**untracked** there.

**4. The site ships a JS runtime from the old design system.**
`Mithtech-payload/src/lib/tonaldepth.js` has unscoped handlers. It has already
fought React twice — stripping `.is-open` off mega panels and clobbering
`aria-expanded`. If a component behaves as though something is fighting it,
that is why.

## Reporting back after each correction

- What you changed — it should be `components/packages/react/src/` plus, at most, a
  registry `.css` and the editorial half of a `Doc` entry
- The published version, if you published one
- What you looked at, at which widths and themes
- Anything the correction revealed that is now wrong in `_LIBRARY.md` or
  `_STATUS.md` — fix it there, don't just mention it

Then stop and wait for the next one.
