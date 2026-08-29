import { defineConfig } from "vite";
import { resolve } from "node:path";

const PACKAGE = resolve(import.meta.dirname, "../../packages/react");

/**
 * In dev the docs resolve the library to its **source**, so editing a component
 * updates this page immediately. Without the alias the docs resolve the
 * package's `main`, which is `dist/index.js`, and a component edit is invisible
 * here until someone remembers to run `pnpm build:react` — measured, not
 * assumed: an edit to `src/badge.tsx` left the rendered badge unchanged.
 *
 * A production docs build keeps the default resolution, so `pnpm build:docs`
 * still proves the artefact a consumer actually installs. `build:docs` runs
 * `build:react` first for that reason.
 *
 * The aliases are anchored regexes. A bare string alias prefix-matches, which
 * would rewrite the `/styles.css` subpath into `src/index.ts/styles.css`.
 */
export default defineConfig(({ command }) => ({
  resolve: {
    alias: command === "serve"
      ? [
          { find: /^@mithtech-bengaluru\/tonaldepth-react$/, replacement: resolve(PACKAGE, "src/index.ts") },
          { find: /^@mithtech-bengaluru\/tonaldepth-react\/styles\.css$/, replacement: resolve(PACKAGE, "src/styles.css") },
        ]
      : [],
  },
}));
