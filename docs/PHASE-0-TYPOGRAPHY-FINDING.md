# Phase 0 typography finding

Status: **canonical mapping approved; licensing evidence pending**

## Confirmed from the archived HTML

| Role token | HTML mapping |
|---|---|
| `--td-font-display` | Anton, Anton Offline, Arial Narrow, sans-serif |
| `--td-font-ui` | Hanken Grotesk, Hanken Grotesk Offline, system-ui, sans-serif |
| `--td-font-sans` | Source Sans 3, Source Sans 3 Offline, system-ui, sans-serif |
| `--td-font-mono` | JetBrains Mono, JetBrains Mono Offline, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace |

The bundle contains 46 `@font-face` records, all mapped to manifest resources: 40 WOFF2 files and 6 TTF files. Exact payload hashes and weights/styles are in `artifacts/phase-0/current/fonts.csv` and `bundled-resources.csv`.

## Source-of-truth decision

On 2026-08-26, the owner selected the offline HTML as the final typography and design baseline. Its four role mappings above are therefore canonical. The differing hosted Storybook mapping must be reconciled to the offline HTML during later Storybook source integration, not promoted into canonical tokens.

## Font provenance state

The owner identified Google Fonts as the source. Engineering must still collect the applicable Google Fonts license files and map them to the exact binary hashes before any font enters a production package.

The mapping is approved, but canonical token files remain Phase 1 work. No production font package is claimed.
