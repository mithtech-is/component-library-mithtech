# TonalDepth

Private-ready, multi-platform TonalDepth design-system reconstruction.

## Current status

- **Confirmed:** the authoritative Claude Design offline HTML is archived byte-for-byte under `static/baselines/claude-html/`.
- **Prepared:** the documented monorepo boundaries and Phase 0 audit workflow exist.
- **Verified:** `python tooling/audit/audit_html.py` produces deterministic token, selector, font, resource, markup, and script/style inventories.
- **Confirmed:** GitHub organization `Mithtech-Bengaluru`, intended npm scope `@mithtech-bengaluru`, private repository name `tonaldepth`, and the offline HTML as the final design/typography baseline.
- **Deferred:** remote creation, teams, maintainers, and approvers. Formal web 1.x scope approval remains open; Phase 1 proceeded on the user's explicit instruction.
- **Closed 2026-08-30:** font licensing and provenance. All four families are SIL OFL 1.1, redistribution and web embedding are permitted, and every referenced binary has an audited SHA-256 that matches what the CDN serves. The evidence is in [`FONTS.md`](FONTS.md).
- **Phase 1 implemented locally:** 115 canonical tokens, deterministic CSS/JSON generation, the preserved web 1.x compatibility layer, a private-ready core prerelease, and packed-consumer verification.
- **Phase 1 limitations:** reusable icon source, chart runtime, and formal visual approval remain open. GitHub publication and font binaries/licences are closed — see [`FONTS.md`](FONTS.md).

The pre-development pack is copied into `others/docs/predevelopment/`; its authoritative source copy is not modified.

## Run the read-only audit

```powershell
python tooling/audit/audit_html.py
```

The command reads the archived baseline without writing to it and replaces only `static/artifacts/phase-0/current/`. It verifies the source checksum before and after analysis.

## Build and verify the canonical foundation

```powershell
npm run tokens:import
npm run tokens:build
npm run test:core
```

Phase status and evidence are recorded in `others/docs/PHASE-1-STATUS.md`.

## Build and verify the React P0 package

```powershell
pnpm build:react
pnpm test:react
pnpm test:react-consumers
```

Phase 2 evidence is recorded in `others/docs/PHASE-2-STATUS.md`.

## Repository layout

Three buckets, plus the two things that are neither: the docs app and the build
system.

```
components/   what ships          packages/{core,react,vue,flutter,nativewind,react-native}
                                  registry/tonaldepth      the shadcn copy-to-source variant
static/       fixtures & evidence examples/                packed-consumer fixtures
                                  baselines/claude-html    the authoritative offline HTML
                                  artifacts/               generated audit + smoke reports
others/       supporting          docs/ specification/ prompts/ tokens/
apps/docs                         the documentation site — `pnpm dev:docs`
tooling/                          generators, token build, Python test suites
```

`tooling/` stays at the root deliberately. Every script in it resolves the repo
root by a hardcoded depth — `Path(__file__).resolve().parents[2]` in Python,
`resolve(import.meta.dirname, "../..")` in JS — and `package.json` invokes one of
them by dotted module path (`python -m unittest tooling.tests.test_native_tokens`).
Moving `tooling/` breaks all three at once, and a wrong root does not raise: the
script finds no input, writes nothing, and exits 0.

`registry.json` stays at the root for the same reason — it is resolved as
`resolve(root, "registry.json")` by the registry builder and `ROOT / "registry.json"`
by the parity tests.

## Distribution decisions

Three distributions ship the same design system and they answer to different
owners, so a token can be correct in one and wrong in another. These are the
calls, written down so an audit stops re-finding them.

### Font tokens live in `components/packages/core`, and only the registry copies them

`--td-font-display`, `--td-font-sans`, `--td-font-ui` and `--td-font-mono` are
declared **once**, in `components/packages/core/dist/tokens.css`, generated from
`others/tokens/source/tokens.json`.

- **The npm package must not re-declare them.** `components/packages/react/src/styles.css`
  opens with `@import "@mithtech-bengaluru/tonaldepth-core"`, and `tonaldepth-core`
  is a hard dependency rather than a peer, so a consumer importing
  `@mithtech-bengaluru/tonaldepth-react/styles.css` resolves all four token
  declarations. Copying the four into `styles.css` would create a fourth place
  for a family to drift, to buy nothing. A consumer that owns its own
  `@font-face` imports `@mithtech-bengaluru/tonaldepth-core/no-fonts` instead of
  dropping the tokens.

  > **Verified reaching a real consumer, 2026-08-30.** This claim was false for
  > most of the library's life and nothing caught it: `tonaldepth-core` sat at
  > `0.1.0-alpha.0`, whose `fonts.css` was a single comment, so an installed
  > consumer got four family names with no faces behind them. `core@0.1.0-alpha.1`
  > carries the 14 `@font-face` blocks, and `tonaldepth-react` now depends on
  > that version rather than `alpha.0`.
  >
  > **Do not verify this by grepping the docs app.** The docs resolve core from
  > the workspace, where `fonts.css` is always fully built, so that check passes
  > while a real install fails — which is exactly how the false claim survived
  > three audits. Verify by installing the published package into a clean tree.
  >
  > Licence and provenance for all four families: [`FONTS.md`](FONTS.md).

- **The registry must carry its own copy.** A registry consumer installs *files*,
  not a package, and has no `tonaldepth-core` to inherit from — so
  `components/registry/tonaldepth/tokens.css` is the one place a duplicate is correct, and
  it has to carry all four roles at the same stacks. A missing role there does
  not fail loudly: it falls through to the browser default and the page reads as
  almost right, which is how `--td-font-sans` went missing unnoticed.

### Both distributions or neither

Nothing lands in `components/packages/react/src/` without landing in
`components/registry/tonaldepth/`.
Two checks hold it, and both run inside `pnpm build:docs`:

```bash
node tooling/registry/generate.mjs --check   # the .tsx items are generated
node tooling/registry/css-parity.mjs         # the .css files are hand-authored
```

The stylesheets are deliberately different documents — the registry's is
self-contained and re-declares the base layer a package consumer inherits — so
the parity check compares *which part, in which state* each rule targets rather
than the raw selector text. The registry having more rules is expected; the
package having a rule the registry lacks is the failure.
