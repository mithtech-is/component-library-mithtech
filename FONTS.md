# Fonts — licence, provenance, and what is actually distributed

**Audited 2026-08-30.** This closes the Phase 0 blocker that read *"exact Google
Fonts licenses/provenance must still be mapped to audited binary hashes."*

Re-run the audit rather than trusting this file if `others/tokens/source/fonts.json`
changes which families load or which package version they come from.

## 1 · The package ships font URLs, not font files

This is the distinction the whole licence question turns on, so it is stated
first and it is verifiable:

- `@mithtech-bengaluru/tonaldepth-core` declares `files: ["dist", "README.md"]`.
- `dist/` contains CSS and JSON only. **There is no font binary in the package,
  the repository, or the published tarball** — `find` for `*.woff*`, `*.ttf`,
  `*.otf` over the repo returns nothing outside `node_modules`.
- `dist/fonts.css` has a **base64 payload count of 0**. Every `@font-face` names
  three `src:` entries: jsDelivr, then unpkg, then a self-hosted `/fonts/…`
  path the *consumer* may provide.

So TonalDepth distributes **a stylesheet that references fonts**. It does not
redistribute Font Software. A consumer's browser fetches the binaries from a
CDN under Fontsource's own distribution, exactly as a Google Fonts `<link>`
would. That is a materially lighter question than shipping audited binaries —
but the licence permits shipping them too, as recorded below, so a future
decision to self-host is already cleared.

## 2 · Licence, per family

All four families are **SIL Open Font License 1.1** (`OFL-1.1`), declared in the
`license` field of each Fontsource package and carried in full as `LICENSE`
inside each tarball.

| Family | Fontsource package | Version | Licence | Copyright line |
|---|---|---|---|---|
| Anton | `@fontsource/anton` | 5.3.0 | OFL-1.1 | Copyright 2020 The Anton Project Authors (https://github.com/googlefonts/AntonFont.git) |
| Source Sans 3 | `@fontsource-variable/source-sans-3` | 5.3.0 | OFL-1.1 | Google Inc. |
| Hanken Grotesk | `@fontsource-variable/hanken-grotesk` | 5.3.0 | OFL-1.1 | Copyright 2021 The Hanken Grotesk Project Authors (https://github.com/marcologous/hanken-grotesk) HankenGrotesk-Italic[wght].ttf: Copyright 2021 The Hanken Grotesk Project Authors (https://github.com/marcologous/hanken-grotesk) |
| JetBrains Mono | `@fontsource-variable/jetbrains-mono` | 5.3.0 | OFL-1.1 | Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono) JetBrainsMono-Italic[wght].ttf: Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono) |

SHA-256 of each `LICENSE` file as audited:

| Family | LICENSE sha256 |
|---|---|
| Anton | `9267baca92b7a7ce9db6dd9e6cc32c9fe3ddf1ac96e421d5f87c5746b9089d6a` |
| Source Sans 3 | `18aabf190848725e2576eefb5c29ba06aac1029d02132252a7f312eac2e50cf3` |
| Hanken Grotesk | `f45f60ca871850c58d8dc9c973bd6fcad40c137e9d037172b961e8ca68c87ef7` |
| JetBrains Mono | `403581b69dac5cff4079205e01c6b467e56af449ecbd7247693ddb1baafa005b` |

### The operative grant, quoted rather than summarised

OFL 1.1, `PERMISSION & CONDITIONS`, identical in all four LICENSE files:

> Permission is hereby granted, free of charge, to any person obtaining
> a copy of the Font Software, to use, study, copy, merge, embed, modify,
> redistribute, and sell modified and unmodified copies of the Font
> Software, subject to the following conditions:

**Redistribution: permitted.** **Web embedding: permitted** — `embed` is named
in the grant, and OFL 1.1 places no separate restriction on `@font-face`.

The five conditions, and how each applies here:

1. *"Neither the Font Software nor any of its individual components … may be
   sold by itself."* — TonalDepth sells nothing, and ships no font.
2. *"Original or Modified Versions … may be bundled, redistributed and/or sold
   with any software, provided that each copy contains the above copyright
   notice and this license."* — **the condition that would bind if this package
   ever ships binaries.** It does not today. If `selfHostedBase` is ever
   populated with real files, the copyright notice and licence must travel with
   them; this file is where they are recorded.
3. *"No Modified Version … may use the Reserved Font Name(s)."* — **none of the
   four declares a Reserved Font Name**, and TonalDepth modifies no outlines, so
   this cannot bind.
4. Author names must not be used to promote a Modified Version — not applicable.
5. *"The Font Software … must be distributed entirely under this license."* —
   binds only a distributor of the Font Software. See §1.

## 3 · Provenance — audited binary hashes

The blocker asked for exact hashes. These are the SHA-256 of every binary the
generated `fonts.css` references, taken from the pinned Fontsource 5.3.0
packages, and **verified byte-identical to what `cdn.jsdelivr.net` serves at the
URLs in the stylesheet — 14 of 14 matched, 0 mismatches**.

| Family | File | Bytes | SHA-256 |
|---|---|---|---|
| `Anton` | `anton-latin-400-normal.woff2` | 18,612 | `d0fa07ff63dd60cbc0e2f58e29c802dca2a5ae0276c999f59c6111ab7bbaec3b` |
| `Anton` | `anton-latin-ext-400-normal.woff2` | 31,356 | `0d17b7880f389deeb6663a52fa4eadc6d9116bdda725f0aa1f3d404fbb7d3d59` |
| `Hanken Grotesk` | `hanken-grotesk-latin-ext-wght-italic.woff2` | 20,388 | `8f7c62f4f329d4f4316da96983f72c65a8aab99387f98d2efc0871f24580ba04` |
| `Hanken Grotesk` | `hanken-grotesk-latin-ext-wght-normal.woff2` | 19,588 | `768af2923e0ab1549f1dfba0a5c8ea749c4c01f01d8e77ffaf7fcd12f57a0a24` |
| `Hanken Grotesk` | `hanken-grotesk-latin-wght-italic.woff2` | 35,592 | `bb432642d7e97d11bd8f7adbcb79dc69b772211c9b6eae5251a969496674d299` |
| `Hanken Grotesk` | `hanken-grotesk-latin-wght-normal.woff2` | 34,704 | `e9201eddf1d41d0b62253295d869ce3cf65768f7102b797f02c7f8c876b4a9d5` |
| `JetBrains Mono` | `jetbrains-mono-latin-ext-wght-italic.woff2` | 16,520 | `60652c78382d7e5021ce4c3ed8985fc41d8f3d1b1a3bedcec2a44ed8979fe5eb` |
| `JetBrains Mono` | `jetbrains-mono-latin-ext-wght-normal.woff2` | 15,196 | `79bfdab9ba467e26eea4122e6f2567e188dd8a09a8c730d501fc487c4ab99c6e` |
| `JetBrains Mono` | `jetbrains-mono-latin-wght-italic.woff2` | 42,964 | `a8afa085e9ca5e53434e2ee918ba6b65c7dd4dda56509976b36591478c99d62e` |
| `JetBrains Mono` | `jetbrains-mono-latin-wght-normal.woff2` | 40,404 | `18be452724bfdc236c074ca94a249a7f41a86752c7d04ab258ce9ed5651f6a7e` |
| `Source Sans 3` | `source-sans-3-latin-ext-wght-italic.woff2` | 59,496 | `6fe10a66ec416f77a26309b645471d032ad8175063bb605b886e9b7e57efaaa8` |
| `Source Sans 3` | `source-sans-3-latin-ext-wght-normal.woff2` | 60,088 | `a85a7459bdb3cdc1136751e151a506bae653fc29ada3ca86237477df6f1b59e6` |
| `Source Sans 3` | `source-sans-3-latin-wght-italic.woff2` | 28,532 | `9a15dafc2c2b2414aaa9d6c30830d9aab4361329d8495b1574633603b994b411` |
| `Source Sans 3` | `source-sans-3-latin-wght-normal.woff2` | 28,740 | `7a19a7027e125257d310c6dbd78ae3a30b5ea1e3794d60b12bb28227a003bfda` |

To re-verify, fetch each URL in `dist/fonts.css` and compare `shasum -a 256`
against this table. A mismatch means the CDN is serving something other than the
audited bytes and should be treated as a supply-chain event, not a cache miss.

## 4 · Status

The Phase 0 blocker is **closed**. Licences are mapped, redistribution and
embedding are permitted, and every referenced binary has an audited hash whose
CDN copy matches.

What remains open is not a licence question: the `/fonts/…` third `src:` entry
is a **consumer-provided** self-hosted fallback. TonalDepth ships no files
there. A consumer that wants no CDN dependency imports
`@mithtech-bengaluru/tonaldepth-core/no-fonts`, keeps the four `--td-font-*`
tokens, and serves its own faces — which is what `Mithtech-payload` does.
