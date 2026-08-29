# Work batch — tokens, fonts, and three gaps

Start the session **inside the library repo**:

```bash
cd /Volumes/Extreme-SSD/Coding/tonaldepth && claude
```

Then paste everything below the line.

---

Five pieces of work, described below. Do them in order — the first two change
tokens that everything else renders against, so doing them last would mean
re-checking every screenshot.

**Read `prompts/CORRECTIONS-PROMPT.md` in this repo first.** It carries the repo layout,
the generated-vs-authored rule, the release loop, the Node version fix and the
four hazards. This file does not repeat them.

The one thing to restate, because it constrains every task here: **you edit
`packages/react/src/` and `tokens/source/tokens.json`, then run
`pnpm generate`.** The registry `.tsx` and the docs props table are generated;
hand edits to them are reverted on the next run and three tests will fail.

## A third directory, read-only

The static design system lives outside both repos:

```
/Volumes/Extreme-SSD/Coding/0000-TonalDept-DesignSystem/
  static/mithtech-tonal-depth.html    19,748 lines — the token set and every component
  FONTS/                              font binaries
  TonalRules.md  AUDIT.md  CHANGELOG.md
```

`0000-*` directories are reference, not projects. **Read from it; never write to
it**, and never write to `/Volumes/Extreme-SSD/Coding` itself.

---

## 1 · Take the fonts from the static system

The package and the static system disagree, and the package is the one that
drifted:

| Role | Static system (`mithtech-tonal-depth.html`) | Package (`tokens/source/tokens.json`) |
|---|---|---|
| `--td-font-display` | `"Anton", "Oswald", "Arial Narrow", sans-serif` | `"Anton", "Anton Offline", "Arial Narrow", sans-serif` |
| `--td-font-sans` | **`"Montserrat", system-ui, sans-serif`** | **`"Source Sans 3", …`** |
| `--td-font-ui` | **`"Space Grotesk", system-ui, sans-serif`** | **`"Hanken Grotesk", …`** |
| `--td-font-mono` | `"JetBrains Mono", ui-monospace, …` | same, plus an `"Offline"` alias |

Adopt the static system's set. Space Grotesk is also the Mithtech brand
typeface, so this aligns the design system with the brand rather than away
from it.

**This contradicts the written law and you must fix that too.**
`Mithtech-payload/page-creation/_COMMON.md` §2.5 names *Source Sans 3* for prose
and *Hanken Grotesk* for UI. Leaving the law and the tokens disagreeing is worse
than either choice: update §2.5 to the new set in the same pass, and note the
change so the next reader knows the law moved deliberately.

**Where fonts may load — do not break this.** `tooling/tests/test_core.py`'s
`test_package_has_no_font_network_requests` holds `packages/core/dist/*.css` to
**zero** font requests: no `@font-face`, no `fonts.googleapis.com`, no
`fonts.gstatic.com`. That is deliberate policy, and a previous attempt to put a
Google Fonts `@import` into `fonts.css` was reverted because of it. Each
consuming app supplies the families itself:

- `apps/docs/index.html` already links the hosted copy — update the families there
- mith.tech self-hosts woff2 from `public/fonts` with `@font-face` in
  `src/styles/tonaldepth.css` — it will need the new families added, and
  `0000-TonalDept-DesignSystem/FONTS/` is where to look for binaries first

Verify by rendering, not by reading CSS: `document.fonts.check('400 48px Anton')`
and the computed `font-family` of a heading, body paragraph and code block.

## 2 · Take the colours from the static system — but keep our orange

Import the static system's colour set into `tokens/source/tokens.json`, with one
explicit exception.

**The dark orange is rejected.** The static system sets:

```css
--td-brand-text:   #CA3E04
--td-warning-text: #CA3E04
```

`#CA3E04` is the dark orange. **Do not adopt it.** Both must resolve to the
papaya, `#FF5E29`, in both themes. The package already does this
(`--td-brand-text: var(--td-brand)`), so the work is to make sure the import
does not undo it, and to hold the line on any other token that reaches for
`#CA3E04` or `--td-brand-deep` for *text*.

This is [[L01]] in `_LEARNINGS.md`, already a standing rule:

> *"Don't use the dark orange use the papaya orange that you use in dark mode
> instead sitewide. It's readable on this lightmode."*

L01 also records the accepted cost: `#FF5E29` on the light ground is ~3.0:1, fine
for large text and UI boundaries, below AA for body-size text. **Keep papaya off
small body copy in light mode** rather than reverting.

Diff the two sets before importing and report anything else that differs — there
may be more than the orange, and a silent colour change is worse than a
discussed one. Tokens whose value is a *reference* (`var(--td-brand)`) must stay
references; do not flatten them to hex.

## 3 · Build `ArticleCard`

Blog article cards are missing. `10-marketing/articlecard` is a **Tier 1 gap —
4 briefs** — and it blocks `/blog`, `/case-studies`, `/knowledge`, `/learn`,
`/concepts`, `/docs` and template `T01`, which alone governs 209 URLs.

The CSS already ships. `packages/core/src/compat.css` carries the whole family:
`.td-article` `.td-article--rich` `.td-articles` `.td-article-head`
`.td-article-cat` `.td-article-title` `.td-article-titlelink`
`.td-article-excerpt` `.td-article-meta` `.td-article-date` `.td-article-read`
`.td-article-author` `.td-article-avatar` `.td-article-badge`
`.td-article-arrow` `.td-article-foot`. Read them before designing an API.

Judge those rules against the design law before reusing them — the last pass
found three shipped marketing rules that broke it (a solid papaya CTA banner, a
gradient case-study visual, mono and prose faces swapped on a metric). If an
`.td-article*` rule breaks the law, build on the `.td-mk-*` namespace with the
correct treatment and say which rule you rejected and why.

Follow the shape the six marketing components already set: whole-card link whose
accessible name is the title alone, the ladder on hover and press, machine values
in mono, and a grid companion. Ship it everywhere a component goes — package,
`ITEMS` in the generator, `TABLES` in `tooling/docs/props.mjs`, `registry.json`,
a registry `.css` that is self-contained, a `Doc` entry, and a test.

## 4 · Fix the Dialog's light-mode elevation

**Reported:** the modal's border looks wrong in light mode and correct in dark.

Here is the likely cause — **verify it before fixing, do not take it on trust.**
`.td-modal` uses `box-shadow: var(--td-raised)` and no border. In light mode
`--td-raised` resolves its lift from `--td-shadow-light: rgba(255,255,255,1)` and
a warm, low-alpha `--td-shadow-dark: rgba(82,70,54,0.30)`, plus a
`0 0 0 1px var(--td-edge)` ring that is a very pale grey. But the modal does not
sit on the page surface — it floats over `.td-overlay-backdrop`, which is
`#000 50%`. Against a dark scrim the white highlight reads as a halo and the
pale ring reads as a light outline rather than an edge. Dark mode looks right
because its shade is `rgba(0,0,0,0.92)` and its highlight is nearly invisible.

If that is the cause, the fix is an elevation treatment for *a panel on a scrim*
rather than a change to `--td-raised`, which is correct for panels on the page.
Scope it to the component (`.td-react-dialog`, `.td-registry-dialog`) rather than
editing `.td-modal`, which mith.tech also owns — see the specificity hazard in
`prompts/CORRECTIONS-PROMPT.md`.

Check `Toast` and `DropdownMenu` for the same problem while you are there: both
float above the surface and may share it.

## 5 · Make colours and fonts easy to change

They already are, and nothing says so. `tokens/source/tokens.json` is a
115-entry W3C-style token file and the single source for every `--td-*`
variable:

```json
{
  "path": "typography.family.ui",
  "$type": "fontFamily",
  "$value": "\"Space Grotesk\", system-ui, sans-serif",
  "$extensions": { "tonaldepth": { "cssVariable": "--td-font-ui", "modes": {} } }
}
```

`modes` carries per-theme overrides. `pnpm tokens:build` regenerates
`packages/core/dist/{tokens.css,tokens.json}`.

Make that discoverable and safe:

- **Wire `tokens:build` into `pnpm generate`**, before the registry step. Today
  a token edit does not reach the build unless you remember the separate
  command — the same class of staleness that had the docs rendering a stale
  `dist` until it was found and fixed.
- **Add a `--check` mode** to `tooling/tokens/build.py` and a parity test that
  fails when `dist` is stale, matching the two generators that already do this.
- **Write `tokens/README.md`**: where to change a colour, where to change a
  font, what `modes` does, how to add a token, and the two rules that constrain
  it — the no-font-requests policy, and [[L01]] on the orange.

## Verification

Every task: `pnpm generate`, `pnpm build:react`, `pnpm test:react`,
`pnpm test:core`, `pnpm test:react-consumers`, and the site's `npm run build` +
`npx tsc --noEmit`.

**Then look at it.** 1440px and 390px, both themes, on
`http://localhost:4176` (docs) and `http://localhost:3000` (site). A green build
is not the bar. Chrome will not resize below ~500px, so render in a 390px-wide
iframe for the mobile pass.

Tasks 1 and 2 change every rendered surface, so re-check at least: the docs
index, a marketing component page, `/contact`, and the Dialog in both themes.

## Report back

- What changed, and in which of `tokens/source/`, `packages/react/src/`,
  `apps/docs/`, or the site
- The published version
- **Every colour or font that changed value**, old → new, so nothing moves
  silently
- What you looked at, at which widths and themes
- Anything in `_LIBRARY.md`, `_STATUS.md` or `_COMMON.md` that this made wrong —
  fix it there, and §2.5 is already known to need it
- The updated gap list: 42 missing before this batch, 41 after `ArticleCard`
