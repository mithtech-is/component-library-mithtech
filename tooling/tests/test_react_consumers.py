#!/usr/bin/env python3
"""Pack TonalDepth packages and production-build clean Vite and Next consumers."""

from __future__ import annotations

import json
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
NPM = shutil.which("npm.cmd") or shutil.which("npm") or "npm"
PNPM = shutil.which("pnpm.cmd") or shutil.which("pnpm") or "pnpm"
REPORT = ROOT / "static" / "artifacts" / "phase-2" / "consumer-smoke.json"


def run(args: list[str], cwd: Path) -> str:
    result = subprocess.run(args, cwd=cwd, check=True, capture_output=True, text=True)
    return result.stdout + result.stderr


def pack(package: Path, destination: Path) -> Path:
    output = run([NPM, "pack", str(package), "--json", "--pack-destination", str(destination)], ROOT)
    data, _ = json.JSONDecoder().raw_decode(output[output.index("["):])
    return destination / data[0]["filename"]


def write_json(path: Path, value: dict) -> None:
    path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")


def install_packages(consumer: Path, dependencies: list[str], tarballs: list[Path]) -> None:
    run([NPM, "install", "--ignore-scripts", "--no-audit", "--no-fund", *dependencies], consumer)
    run([NPM, "install", "--ignore-scripts", "--no-audit", "--no-fund", *map(str, tarballs)], consumer)


def vite_consumer(base: Path, tarballs: list[Path]) -> dict:
    consumer = base / "vite"
    (consumer / "src").mkdir(parents=True)
    write_json(consumer / "package.json", {"name": "clean-vite-consumer", "private": True, "type": "module", "scripts": {"build": "vite build"}})
    (consumer / "index.html").write_text('<div id="root"></div><script type="module" src="/src/main.jsx"></script>\n', encoding="utf-8")
    (consumer / "src/main.jsx").write_text(
        'import React from "react";import{createRoot}from"react-dom/client";'
        'import{Badge,Button,Card,Checkbox,DashboardPage,DashboardPanel,FilterBar,KpiCard,Tabs}from"@mithtech-bengaluru/tonaldepth-react";'
        'import"@mithtech-bengaluru/tonaldepth-react/styles.css";'
        'createRoot(document.getElementById("root")).render(<DashboardPage title="Packed Vite" metrics={<KpiCard label="Orders" value="42"/>}><DashboardPanel title="Components"><Card><Badge>Vite</Badge><Button variant="primary">Ready</Button><Checkbox label="Enabled"/><Tabs items={[{value:"one",label:"One",content:"Packed P1"}]}/><FilterBar options={[{value:"active",label:"Active"}]}/></Card></DashboardPanel></DashboardPage>);\n',
        encoding="utf-8",
    )
    install_packages(consumer, ["react@19.2.8", "react-dom@19.2.8", "vite@8.2.2"], tarballs)
    output = run([NPM, "run", "build"], consumer)
    return {"status": "verified", "dist_files": sorted(str(path.relative_to(consumer / "dist")).replace("\\", "/") for path in (consumer / "dist").rglob("*") if path.is_file())}


def next_consumer(base: Path, tarballs: list[Path]) -> dict:
    consumer = base / "next"
    app = consumer / "app"
    app.mkdir(parents=True)
    write_json(consumer / "package.json", {"name": "clean-next-consumer", "private": True, "scripts": {"build": "next build --webpack"}})
    (consumer / "tsconfig.json").write_text((ROOT / "static/examples/next-consumer/tsconfig.json").read_text(encoding="utf-8"), encoding="utf-8")
    (consumer / "next-env.d.ts").write_text('/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n', encoding="utf-8")
    (app / "layout.tsx").write_text(
        'import"@mithtech-bengaluru/tonaldepth-react/styles.css";export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body className="td-root">{children}</body></html>}\n',
        encoding="utf-8",
    )
    (app / "page.tsx").write_text(
        'import{Alert,Badge,ChartContainer,DashboardPage,DashboardPanel,KpiCard,Table,TableBody,TableCell,TableContainer,TableHead,TableHeader,TableRow}from"@mithtech-bengaluru/tonaldepth-react";'
        'export default function Page(){return <DashboardPage title="Packed Next" metrics={<KpiCard label="Orders" value="42"/>}><DashboardPanel title="Server pattern"><Alert title="Packed">P3 server-safe exports</Alert><ChartContainer title="Orders" description="42 orders"><svg role="img" aria-label="Orders chart"/></ChartContainer><TableContainer><Table><TableHead><TableRow><TableHeader>Package</TableHeader></TableRow></TableHead><TableBody><TableRow><TableCell><Badge>React</Badge></TableCell></TableRow></TableBody></Table></TableContainer></DashboardPanel></DashboardPage>}\n',
        encoding="utf-8",
    )
    install_packages(consumer, ["next@16.3.3", "react@19.2.8", "react-dom@19.2.8", "typescript@7.0.2", "@types/react@19.2.18", "@types/react-dom@19.2.3", "@types/node@26.3.0"], tarballs)
    output = run([NPM, "run", "build"], consumer)
    return {"status": "verified", "static_page": (consumer / ".next/server/app/index.html").exists()}


def main() -> None:
    run([NPM, "run", "tokens:build"], ROOT)
    run([PNPM, "build:react"], ROOT)
    with tempfile.TemporaryDirectory(prefix="tonaldepth-phase2-") as folder:
        temp = Path(folder)
        tarballs = [pack(ROOT / "components/packages/core", temp), pack(ROOT / "components/packages/react", temp)]
        report = {
            "packages": [path.name for path in tarballs],
            "vite": vite_consumer(temp, tarballs),
            "next": next_consumer(temp, tarballs),
            "workspace_aliases_used": False,
        }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    write_json(REPORT, report)
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
