import { copyFile, mkdir, readdir } from "node:fs/promises";

const src = new URL("../src/", import.meta.url);
const dist = new URL("../dist/", import.meta.url);

await mkdir(dist, { recursive: true });
for (const name of await readdir(src)) {
  if (name.endsWith(".css")) await copyFile(new URL(name, src), new URL(name, dist));
}
