import { defineConfig } from "vite";
import { resolve } from "node:path";

/**
 * The preview resolves the core token package to its source, so a token change
 * shows up here without a rebuild of `tonaldepth-core` first.
 */
export default defineConfig({
  root: resolve(import.meta.dirname, "preview"),
  resolve: {
    alias: [
      {
        find: /^@mithtech-bengaluru\/tonaldepth-core$/,
        replacement: resolve(import.meta.dirname, "../core/dist/index.css"),
      },
      /* The outgoing library, resolved to its built artefact purely so the
         preview can put old and new side by side while the port is reviewed.
         Not a dependency of this package. */
      {
        find: /^@mithtech-bengaluru\/tonaldepth-react$/,
        replacement: resolve(import.meta.dirname, "../react/dist/index.js"),
      },
    ],
  },
  server: { port: 4180 },
});
