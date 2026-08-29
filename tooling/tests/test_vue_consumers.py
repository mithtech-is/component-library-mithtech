#!/usr/bin/env python3
"""Pack TonalDepth packages and build clean Vue and Nuxt consumers."""
from __future__ import annotations
import json
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
NPM = shutil.which("npm.cmd") or shutil.which("npm") or "npm"
PNPM = shutil.which("pnpm.cmd") or shutil.which("pnpm") or "pnpm"
REPORT = ROOT / "static" / "artifacts" / "phase-3" / "vue-consumer-smoke.json"

def run(args: list[str], cwd: Path) -> str:
    result = subprocess.run(args, cwd=cwd, check=True, capture_output=True, text=True)
    return result.stdout + result.stderr

def write(path: Path, value: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(value, encoding="utf-8")

def write_json(path: Path, value: dict) -> None:
    write(path, json.dumps(value, indent=2) + "\n")

def pack(package: Path, destination: Path) -> Path:
    output = run([NPM, "pack", ".", "--json", "--pack-destination", str(destination)], package)
    data, _ = json.JSONDecoder().raw_decode(output[output.index("["):])
    return destination / data[0]["filename"]

def install(consumer: Path, dependencies: list[str], tarballs: list[Path]) -> None:
    run([NPM, "install", "--ignore-scripts", "--no-audit", "--no-fund", *dependencies], consumer)
    run([NPM, "install", "--ignore-scripts", "--no-audit", "--no-fund", *map(str, tarballs)], consumer)

def vite_consumer(base: Path, tarballs: list[Path]) -> dict:
    consumer = base / "vite-vue"
    consumer.mkdir()
    write_json(consumer / "package.json", {"name": "clean-vite-vue-consumer", "private": True, "type": "module", "scripts": {"build": "vite build"}})
    write(consumer / "index.html", '<div id="app"></div><script type="module" src="/src/main.js"></script>\n')
    write(consumer / "src/main.js", 'import{createApp,h}from"vue";import{TdBadge,TdButton,TdCard,TdFormField,TdInput}from"@mithtech-bengaluru/tonaldepth-vue";import"@mithtech-bengaluru/tonaldepth-vue/styles.css";createApp({render:()=>h(TdCard,null,{default:()=>[h(TdBadge,{variant:"success"},{default:()=>"Vue"}),h(TdFormField,{label:"Name"},{default:()=>h(TdInput)}),h(TdButton,{variant:"primary"},{default:()=>"Ready"})]})}).mount("#app");\n')
    install(consumer, ["vue@3.5.41", "vite@8.2.2"], tarballs)
    run([NPM, "run", "build"], consumer)
    return {"status": "verified", "dist_files": sorted(str(path.relative_to(consumer / "dist")).replace("\\", "/") for path in (consumer / "dist").rglob("*") if path.is_file())}

def nuxt_consumer(base: Path, tarballs: list[Path]) -> dict:
    consumer = base / "nuxt"
    consumer.mkdir()
    write_json(consumer / "package.json", {"name": "clean-nuxt-consumer", "private": True, "type": "module", "scripts": {"build": "nuxt build"}})
    write(consumer / "nuxt.config.ts", 'export default defineNuxtConfig({css:["@mithtech-bengaluru/tonaldepth-vue/styles.css"],compatibilityDate:"2026-08-26"})\n')
    write(consumer / "app/app.vue", '<script setup lang="ts">import{TdBadge,TdButton,TdCard,TdCardContent,TdCardHeader,TdCardTitle}from"@mithtech-bengaluru/tonaldepth-vue"</script><template><main class="td-root"><TdCard><TdCardHeader><TdCardTitle>Nuxt</TdCardTitle><TdBadge variant="success">SSR</TdBadge></TdCardHeader><TdCardContent><TdButton variant="primary">Ready</TdButton></TdCardContent></TdCard></main></template>\n')
    install(consumer, ["nuxt@4.5.2", "vue@3.5.41"], tarballs)
    run([NPM, "run", "build"], consumer)
    return {"status": "verified", "server_entry": (consumer / ".output/server/index.mjs").exists(), "public_assets": (consumer / ".output/public").exists()}

def main() -> None:
    run([NPM, "run", "tokens:build"], ROOT)
    run([PNPM, "build:vue"], ROOT)
    with tempfile.TemporaryDirectory(prefix="tonaldepth-phase3-vue-") as folder:
        temp = Path(folder)
        tarballs = [pack(ROOT / "components/packages/core", temp), pack(ROOT / "components/packages/vue", temp)]
        report = {"packages": [path.name for path in tarballs], "vue_version": "3.5.41", "nuxt_version": "4.5.2", "vite": vite_consumer(temp, tarballs), "nuxt": nuxt_consumer(temp, tarballs), "workspace_aliases_used": False}
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    write_json(REPORT, report)
    print(json.dumps(report, indent=2))

if __name__ == "__main__":
    main()
