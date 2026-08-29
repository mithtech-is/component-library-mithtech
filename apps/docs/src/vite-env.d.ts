/// <reference types="vite/client" />

declare module "*.css";

/* The core package exports dist/tokens.json as a subpath. Vite resolves and
   bundles it; TypeScript will not type a JSON subpath export on its own, and
   the shape is the generator's, so it is declared rather than inferred. */
declare module "@mithtech-bengaluru/tonaldepth-core/tokens.json" {
  const tokens: Record<
    string,
    {
      path: string;
      $type: string;
      $value: string;
      $description: string;
      $extensions: { tonaldepth: { cssVariable: string; modes: Record<string, string> } };
    }
  >;
  export default tokens;
}
