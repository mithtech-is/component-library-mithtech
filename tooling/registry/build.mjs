import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const manifest = JSON.parse(await readFile(resolve(root, "registry.json"), "utf8"));
const output = resolve(root, "apps/docs/public/r");
await mkdir(output, { recursive: true });

for (const item of manifest.items) {
  const files = [];
  for (const file of item.files) {
    files.push({ ...file, content: await readFile(resolve(root, file.path), "utf8") });
  }
  const stylePath = `registry/tonaldepth/${item.name}.css`;
  if (!files.some(file => file.path === stylePath)) {
    try {
      files.push({ path: stylePath, type: "registry:style", target: `components/ui/tonaldepth-${item.name}.css`, content: await readFile(resolve(root, stylePath), "utf8") });
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  await writeFile(resolve(output, `${item.name}.json`), `${JSON.stringify({ $schema: "https://ui.shadcn.com/schema/registry-item.json", ...item, files }, null, 2)}\n`);
}

await writeFile(resolve(output, "registry.json"), `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Built ${manifest.items.length} TonalDepth registry item(s) in ${output}`);
