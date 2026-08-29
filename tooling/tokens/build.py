#!/usr/bin/env python3
"""Validate canonical tokens and deterministically build the core package."""

from __future__ import annotations

import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "others" / "tokens" / "source" / "tokens.json"
FONTS = ROOT / "others" / "tokens" / "source" / "fonts.json"
DIST = ROOT / "components" / "packages" / "core" / "dist"
COMPAT = ROOT / "components" / "packages" / "core" / "src" / "compat.css"
CSS_NAME = re.compile(r"^--td-[a-z0-9-]+$")
REF = re.compile(r"var\((--td-[a-z0-9-]+)")


def validate(document: dict) -> list[dict]:
    if document.get("schemaVersion") != 1 or not isinstance(document.get("tokens"), list):
        raise ValueError("Unsupported canonical token document")
    tokens = document["tokens"]
    paths, variables = set(), set()
    for token in tokens:
        required = {"path", "$type", "$value", "$description", "$extensions"}
        missing = required - token.keys()
        if missing:
            raise ValueError(f"{token.get('path', '<unknown>')}: missing {sorted(missing)}")
        path = token["path"]
        css_var = token["$extensions"]["tonaldepth"]["cssVariable"]
        if path in paths or css_var in variables:
            raise ValueError(f"Duplicate token path or variable: {path} / {css_var}")
        if not CSS_NAME.fullmatch(css_var):
            raise ValueError(f"Invalid CSS variable: {css_var}")
        paths.add(path)
        variables.add(css_var)
    unknown = []
    for token in tokens:
        values = [token["$value"], *token["$extensions"]["tonaldepth"].get("modes", {}).values()]
        for value in values:
            unknown.extend(ref for ref in REF.findall(str(value)) if ref not in variables)
    if unknown:
        raise ValueError(f"Unknown token references: {sorted(set(unknown))}")
    return sorted(tokens, key=lambda item: item["path"])


def declarations(tokens: list[dict], mode: str | None = None) -> list[str]:
    lines = []
    for token in sorted(tokens, key=lambda item: item["$extensions"]["tonaldepth"]["cssVariable"]):
        ext = token["$extensions"]["tonaldepth"]
        value = ext.get("modes", {}).get(mode, token["$value"])
        if mode is None or mode in ext.get("modes", {}):
            lines.append(f"  {ext['cssVariable']}: {value};")
    return lines



def font_filename(family: dict, subset: str, style: str) -> str:
    """Fontsource's own file naming, so a self-hosted copy is a plain `cp`."""
    axis = "wght" if family["variable"] else family["weight"]
    return f"{family['slug']}-{subset}-{axis}-{style}.woff2"


def font_faces(document: dict) -> list[str]:
    """CDN first, second CDN next, self-hosted last — one @font-face per face.

    The failover is the `src:` list itself: a browser walks the sources in
    order and uses the first that loads, so a blocked or down CDN costs a
    failed request rather than a missing face. This is the only mechanism
    that actually fails over — two @import-ed stylesheets would both be
    fetched and the later one would shadow the earlier.
    """
    cdns = document["cdns"]
    base = document["selfHostedBase"].rstrip("/")
    subsets = document["subsets"]
    lines: list[str] = []
    for family in document["families"]:
        lines.append(f"/* {family['family']} — {family['role']} ({family['token']}) */")
        for style in family["styles"]:
            for subset in family["subsets"]:
                filename = font_filename(family, subset, style)
                sources = [f'url("{cdn}/{family["package"]}/files/{filename}") format("woff2")' for cdn in cdns]
                sources.append(f'url("{base}/{filename}") format("woff2")')
                joined = ",\n    ".join(sources)
                lines.extend([
                    "@font-face {",
                    f'  font-family: "{family["family"]}";',
                    f"  font-style: {style};",
                    f"  font-weight: {family['weight']};",
                    "  font-display: swap;",
                    f"  src:\n    {joined};",
                    f"  unicode-range: {subsets[subset]};",
                    "}",
                ])
        lines.append("")
    return lines


def fonts_css(document: dict) -> str:
    header = [
        "/* Generated from others/tokens/source/fonts.json. Do not edit. */",
        "/*",
        " * TonalDepth type stack, by role:",
    ]
    for family in document["families"]:
        header.append(f" *   {family['token']:<20} {family['family']} — {family['role']}")
    header.extend([
        " *",
        " * Loading order per face: CDN, then a second CDN, then a self-hosted copy",
        f" * at {document['selfHostedBase']}/. Self-hosting is the fallback, not the default —",
        " * drop the fontsource .woff2 files there under the same names and the third",
        " * source starts answering whenever both CDNs are unreachable.",
        " *",
        " * This file is imported by index.css. For a build that must make no font",
        " * network request at all, import index-no-fonts.css instead.",
        " */",
        "",
    ])
    return "\n".join(header + font_faces(document))


def render() -> dict[str, str]:
    """Produce the exact set of files build() writes to dist, as (name -> text)."""
    document = json.loads(SOURCE.read_text(encoding="utf-8"))
    tokens = validate(document)
    root = declarations(tokens)
    dark = declarations(tokens, "dark")
    compact = declarations(tokens, "compact")
    comfortable = declarations(tokens, "comfortable")
    spacious = declarations(tokens, "spacious")
    css_lines = [
        "/* Generated from others/tokens/source/tokens.json. Do not edit. */",
        ":root,", '[data-theme="light"] {', *root, "}", "",
        '@media (prefers-color-scheme: dark) {',
        '  :root:not([data-theme="light"]):not([data-theme="dark"]) {',
        *["  " + line for line in dark], "  }", "}", "",
        '[data-theme="dark"] {', *dark, "}", "",
        '[data-density="compact"] {', *compact, "}", "",
        '[data-density="comfortable"] {', *comfortable, "}", "",
        '[data-density="spacious"] {', *spacious, "}", "",
    ]
    return {
        "tokens.css": "\n".join(css_lines),
        "tokens.json": json.dumps({item["path"]: item for item in tokens}, indent=2) + "\n",
        "compat.css": COMPAT.read_text(encoding="utf-8"),
        # @import must precede other rules, so fonts.css leads.
        "index.css": '@import "./fonts.css";\n@import "./compat.css";\n@import "./tokens.css";\n',
        "index-no-fonts.css": (
            "/* Everything index.css has, minus the @font-face layer: use this when the\n"
            "   page must make no font network request and supplies the four families\n"
            "   itself (self-hosted, next/font, or already installed). */\n"
            '@import "./compat.css";\n@import "./tokens.css";\n'
        ),
        "fonts.css": fonts_css(json.loads(FONTS.read_text(encoding="utf-8"))),
    }


def main(check: bool = False) -> int:
    files = render()
    document = json.loads(SOURCE.read_text(encoding="utf-8"))
    tokens = validate(document)
    if check:
        stale: list[str] = []
        for name, text in files.items():
            path = DIST / name
            if not path.exists() or path.read_text(encoding="utf-8") != text:
                stale.append(name)
        if stale:
            print("Tokens dist is stale — run `pnpm tokens:build`. Files: " + ", ".join(stale), file=sys.stderr)
            return 1
        print(f"Tokens dist is current ({len(tokens)} tokens).")
        return 0
    DIST.mkdir(parents=True, exist_ok=True)
    for name, text in files.items():
        (DIST / name).write_text(text, encoding="utf-8")
    print(f"Built {len(tokens)} canonical tokens")
    return 0


if __name__ == "__main__":
    sys.exit(main(check="--check" in sys.argv[1:]))
