#!/usr/bin/env python3
"""Seed canonical TonalDepth tokens and legacy CSS from the approved HTML baseline."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tooling" / "audit"))
from audit_html import InventoryParser  # noqa: E402

SOURCE = ROOT / "static" / "baselines" / "claude-html" / "TonalDepth Dashboard (offline).html"
TOKENS = ROOT / "tokens" / "source" / "tokens.json"
LEGACY = ROOT / "components" / "packages" / "core" / "src" / "compat.css"
DASHBOARD = ROOT / "static" / "examples" / "html-dashboard" / "index.html"


def block(text: str, selector_pattern: str) -> str:
    match = re.search(selector_pattern + r"\s*\{", text, re.M)
    if not match:
        raise ValueError(f"Missing CSS block: {selector_pattern}")
    start = match.end()
    depth = 1
    for index in range(start, len(text)):
        if text[index] == "{":
            depth += 1
        elif text[index] == "}":
            depth -= 1
            if depth == 0:
                return text[start:index]
    raise ValueError(f"Unclosed CSS block: {selector_pattern}")


def declarations(body: str) -> dict[str, str]:
    body = re.sub(r"/\*.*?\*/", "", body, flags=re.S)
    found = {}
    for match in re.finditer(r"(--td-[\w-]+)\s*:\s*(.*?);", body, re.S):
        found[match.group(1)] = " ".join(match.group(2).split())
    return found


def remove_block(text: str, selector_pattern: str) -> str:
    match = re.search(selector_pattern + r"\s*\{", text, re.M)
    if not match:
        return text
    depth = 1
    for index in range(match.end(), len(text)):
        if text[index] == "{":
            depth += 1
        elif text[index] == "}":
            depth -= 1
            if depth == 0:
                return text[:match.start()] + text[index + 1:]
    raise ValueError(f"Unclosed CSS block: {selector_pattern}")


def token_type(name: str, value: str) -> str:
    if name.startswith(("--td-font-",)):
        return "fontFamily"
    if name.startswith("--td-t-"):
        return "duration"
    if name.startswith("--td-ease"):
        return "cubicBezier"
    if "shadow" in name or name in {"--td-raised", "--td-inset-soft", "--td-inset-deep", "--td-btn-rest", "--td-btn-hover", "--td-btn-active"}:
        return "shadow"
    if name.startswith(("--td-sp-", "--td-radius-", "--td-container-", "--td-icon-")) or name in {"--td-btn-h", "--td-btn-h-lg", "--td-measure", "--td-section-pad", "--td-section-pad-lg"}:
        return "dimension"
    if name in {"--td-density", "--td-icon-stroke", "--td-icon-stroke-bold"}:
        return "number"
    if re.fullmatch(r"#[0-9a-fA-F]{3,8}|rgba?\(.*\)|oklch\(.*\)|var\(--td-[\w-]+\)", value) and any(term in name for term in ("bg", "surface", "ink", "brand", "accent", "green", "error", "warning", "series", "highlight", "fill")):
        return "color"
    return "string"


def path_for(name: str) -> str:
    short = name.removeprefix("--td-")
    if short.startswith("sp-"):
        return "spacing." + short[3:]
    if short.startswith("radius-"):
        return "radius." + short[7:]
    if short.startswith("font-"):
        return "typography.family." + short[5:]
    if short.startswith("t-"):
        return "motion.duration." + short[2:]
    if short.startswith("ease"):
        return "motion.easing." + short.replace("ease", "default", 1).strip("-")
    if short.startswith("container-") or short == "measure":
        return "layout." + short
    if short.startswith("icon-"):
        return "icon." + short[5:]
    if "shadow" in short or short in {"raised", "inset-soft", "inset-deep", "btn-rest", "btn-hover", "btn-active"}:
        return "depth." + short
    if any(term in short for term in ("bg", "surface", "ink", "brand", "accent", "green", "error", "warning", "series", "highlight", "fill")):
        return "color." + short
    return "web." + short


def main() -> None:
    outer = InventoryParser()
    outer.feed(SOURCE.read_text(encoding="utf-8"))
    template = json.loads(next(item["content"] for item in outer.scripts if item["type"] == "__bundler/template"))
    inner = InventoryParser()
    inner.feed(template)
    css = "\n".join(inner.styles)
    root = declarations(block(css, r"(?m)^\s*:root"))
    dark = declarations(block(css, r'(?m)^\s*:root\[data-theme="dark"\]'))
    compact = declarations(block(css, r'(?m)^\s*\[data-density="compact"\]'))
    comfortable = declarations(block(css, r'(?m)^\s*\[data-density="comfortable"\]'))
    spacious = declarations(block(css, r'(?m)^\s*\[data-density="spacious"\]'))

    records = []
    for css_var, value in sorted(root.items()):
        modes = {}
        if css_var in dark and dark[css_var] != value:
            modes["dark"] = dark[css_var]
        if css_var == "--td-density":
            modes.update({
                "compact": compact.get(css_var, "0.75"),
                "comfortable": comfortable.get(css_var, "1"),
                "spacious": spacious.get(css_var, "1.35"),
            })
        records.append({
            "path": path_for(css_var),
            "$type": token_type(css_var, value),
            "$value": value,
            "$description": f"Canonical value for legacy {css_var}.",
            "$extensions": {
                "tonaldepth": {
                    "cssVariable": css_var,
                    "stability": "public-1.x",
                    "source": "offline-html",
                    "modes": modes,
                }
            },
        })

    document = {
        "$schema": "../schema/tokens.schema.json",
        "schemaVersion": 1,
        "metadata": {
            "name": "TonalDepth",
            "canonicalBaseline": "offline-html",
            "themeModes": ["light", "dark", "system"],
            "densityModes": ["compact", "comfortable", "spacious"],
            "brandModes": ["mithtech"],
            "compatibility": "Existing --td-* variables remain public through web 1.x.",
        },
        "tokens": records,
    }
    TOKENS.parent.mkdir(parents=True, exist_ok=True)
    TOKENS.write_text(json.dumps(document, indent=2) + "\n", encoding="utf-8")
    compatibility = css
    for selector in (
        r"(?m)^\s*:root",
        r'(?m)^\s*:root\[data-theme="dark"\]',
        r'(?m)^\s*\[data-density="compact"\]',
        r'(?m)^\s*\[data-density="comfortable"\]',
        r'(?m)^\s*\[data-density="spacious"\]',
    ):
        compatibility = remove_block(compatibility, selector)
    compatibility = re.sub(r"@import\s+url\([^;]+;", "", compatibility, flags=re.I)
    compatibility = re.sub(r"@font-face\s*\{.*?\}", "", compatibility, flags=re.I | re.S)
    LEGACY.parent.mkdir(parents=True, exist_ok=True)
    LEGACY.write_text(
        "/* Extracted compatibility CSS from the approved offline HTML. Token roots and fonts are owned by generated foundation outputs. */\n"
        + compatibility.strip() + "\n",
        encoding="utf-8",
    )
    dashboard = re.sub(r"<style(?:\s[^>]*)?>.*?</style>", "", template, flags=re.I | re.S)
    dashboard = re.sub(r"<script(?:\s[^>]*)?>.*?</script>", "", dashboard, flags=re.I | re.S)
    dashboard = dashboard.replace(
        "</head>",
        '  <link rel="stylesheet" href="../../packages/core/dist/index.css">\n</head>',
        1,
    )
    dashboard = "<!-- Generated from approved offline HTML markup; styles come from the core package. -->\n" + dashboard
    DASHBOARD.parent.mkdir(parents=True, exist_ok=True)
    DASHBOARD.write_text(dashboard, encoding="utf-8")
    print(f"Imported {len(records)} root tokens and {len(css.encode('utf-8'))} CSS bytes")


if __name__ == "__main__":
    main()
