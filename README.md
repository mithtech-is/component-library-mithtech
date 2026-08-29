# TonalDepth

Private-ready, multi-platform TonalDepth design-system reconstruction.

## Current status

- **Confirmed:** the authoritative Claude Design offline HTML is archived byte-for-byte under `baselines/claude-html/`.
- **Prepared:** the documented monorepo boundaries and Phase 0 audit workflow exist.
- **Verified:** `python tooling/audit/audit_html.py` produces deterministic token, selector, font, resource, markup, and script/style inventories.
- **Confirmed:** GitHub organization `Mithtech-Bengaluru`, intended npm scope `@mithtech-bengaluru`, private repository name `tonaldepth`, and the offline HTML as the final design/typography baseline.
- **Deferred:** remote creation, teams, maintainers, and approvers. Font licensing evidence and formal web 1.x scope approval remain open; Phase 1 proceeded on the user's explicit instruction.
- **Phase 1 implemented locally:** 115 canonical tokens, deterministic CSS/JSON generation, the preserved web 1.x compatibility layer, a private-ready core prerelease, and packed-consumer verification.
- **Phase 1 limitations:** GitHub publication, font binaries/licenses, reusable icon source, chart runtime, and formal visual approval remain open.

The pre-development pack is copied into `docs/predevelopment/`; its authoritative source copy is not modified.

## Run the read-only audit

```powershell
python tooling/audit/audit_html.py
```

The command reads the archived baseline without writing to it and replaces only `artifacts/phase-0/current/`. It verifies the source checksum before and after analysis.

## Build and verify the canonical foundation

```powershell
npm run tokens:import
npm run tokens:build
npm run test:core
```

Phase status and evidence are recorded in `docs/PHASE-1-STATUS.md`.

## Build and verify the React P0 package

```powershell
pnpm build:react
pnpm test:react
pnpm test:react-consumers
```

Phase 2 evidence is recorded in `docs/PHASE-2-STATUS.md`.

## Distribution decisions

Three distributions ship the same design system and they answer to different
owners, so a token can be correct in one and wrong in another. These are the
calls, written down so an audit stops re-finding them.

### Font tokens live in `packages/core`, and only the registry copies them

`--td-font-display`, `--td-font-sans`, `--td-font-ui` and `--td-font-mono` are
declared **once**, in `packages/core/dist/tokens.css`, generated from
`tokens/source/tokens.json`.

- **The npm package must not re-declare them.** `packages/react/src/styles.css`
  opens with `@import "@mithtech-bengaluru/tonaldepth-core"`, and `tonaldepth-core`
  is a hard dependency rather than a peer, so a consumer importing
  `@mithtech-bengaluru/tonaldepth-react/styles.css` already resolves all four —
  and the `@font-face` blocks with them. Verified by grepping the docs app's own
  bundled stylesheet, which is a real consumer of that entry point. Copying the
  four into `styles.css` would create a fourth place for a family to drift, to
  buy nothing. A consumer that owns its own `@font-face` imports
  `@mithtech-bengaluru/tonaldepth-core/no-fonts` instead of dropping the tokens.
- **The registry must carry its own copy.** A registry consumer installs *files*,
  not a package, and has no `tonaldepth-core` to inherit from — so
  `registry/tonaldepth/tokens.css` is the one place a duplicate is correct, and
  it has to carry all four roles at the same stacks. A missing role there does
  not fail loudly: it falls through to the browser default and the page reads as
  almost right, which is how `--td-font-sans` went missing unnoticed.

### Both distributions or neither

Nothing lands in `packages/react/src/` without landing in `registry/tonaldepth/`.
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
