/**
 * Brand & company logos — the public surface, mirroring `icons.ts`.
 *
 * `icons.ts` resolves a UI role to a glyph; this resolves a brand slug to its
 * mark. The marks themselves are drawn in `./td-brands` (generated from
 * `tooling/brands/`), the sibling of `./td-icons`. Kept apart from the icon set
 * on purpose: a brand mark carries its own colour, which the icon neutrality
 * rule forbids. Consume a mark by name — `<BrandLogo name="medusa" />` — or
 * import the component directly.
 *
 * Also the entry for the `./brands` package subpath, so a consumer's content
 * build can resolve a company logo from TonalDepth without pulling the whole
 * component surface.
 */
export * from "./td-brands";
