#!/usr/bin/env python3
"""Reconcile canonical TonalDepth tokens with the approved HTML baseline.

The baseline owns colour, spacing, motion and depth values. It does not own the
whole token set: tokens authored after the import (the filament, glow, lamp and
row ladders) live only here, and four font stacks are deliberately ours. So the
default run MERGES — baseline values land on the tokens the baseline defines and
nothing else is touched.

    python tooling/tokens/import_baseline.py --check   # read-only, exits 1 on drift
    python tooling/tokens/import_baseline.py           # merge baseline values in
    python tooling/tokens/import_baseline.py --reseed  # also rewrite compat.css

`--reseed` is the original behaviour and is destructive: compat.css has been
hand-tuned since the import (the dropdown and undobar inset states), and
re-extracting it from the baseline throws that away. It stays opt-in.
"""

from __future__ import annotations

import argparse
import copy
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tooling" / "audit"))
from audit_html import InventoryParser  # noqa: E402

SOURCE = ROOT / "static" / "baselines" / "claude-html" / "TonalDepth Dashboard (offline).html"
TOKENS = ROOT / "others" / "tokens" / "source" / "tokens.json"
LEGACY = ROOT / "components" / "packages" / "core" / "src" / "compat.css"
DASHBOARD = ROOT / "static" / "examples" / "html-dashboard" / "index.html"

# Font stacks the baseline defines but must not export. The offline document
# declares a `<Family> Offline` @font-face for each family so it can render with
# no network; those families exist in that one file and nowhere in the shipped
# CSS, so importing the stacks that name them would give every consumer a
# fallback that can never resolve. Both distribution channels already drop them.
BASELINE_EXCLUDES = {
    "--td-font-display",
    "--td-font-mono",
    "--td-font-sans",
    "--td-font-ui",
    # The two recess materials, held back for the opposite reason to the fonts:
    # here the baseline is OLDER than the tokens are. `feat(depth): carve the
    # well so it reads on paper` re-cut both so a well survives being printed,
    # and the baseline still carries the pair that replaced — so an import
    # would revert that silently. It would also drop dark mode outright: the
    # baseline declares no dark value for either, and every surface in the
    # system that recesses reads from these.
    #
    # A token leaves this set when the baseline is re-exported from a document
    # that already has the current values in it, not before.
    "--td-inset-deep",
    "--td-inset-soft",
}


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


def baseline_records() -> tuple[list[dict], str]:
    """Every `:root` token the approved offline HTML defines, in a token-file shape."""
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
    return records, css


def variable_of(token: dict) -> str:
    return token["$extensions"]["tonaldepth"]["cssVariable"]


def merge(existing: list[dict], records: list[dict]) -> list[dict]:
    """Lay baseline values over the tokens the baseline owns, keeping the rest.

    Only `$value` and the mode overrides move. `path`, `$type` and
    `$description` stay as committed so a hand-sharpened description survives a
    reconcile, and a token the baseline has never heard of is passed straight
    through — that is what makes this safe to run.
    """
    fresh = {variable_of(record): record for record in records}
    merged = []
    for token in existing:
        record = fresh.pop(variable_of(token), None)
        if record is None or variable_of(token) in BASELINE_EXCLUDES:
            merged.append(token)
            continue
        updated = copy.deepcopy(token)
        updated["$value"] = record["$value"]
        updated["$extensions"]["tonaldepth"]["modes"] = record["$extensions"]["tonaldepth"]["modes"]
        merged.append(updated)
    # A token added to the baseline since the last reconcile has no home yet.
    merged.extend(fresh[name] for name in sorted(fresh) if name not in BASELINE_EXCLUDES)
    return merged


def drift(existing: list[dict], records: list[dict]) -> list[str]:
    committed = {variable_of(token): token for token in existing}
    report = []
    for record in records:
        name = variable_of(record)
        if name in BASELINE_EXCLUDES:
            continue
        token = committed.get(name)
        if token is None:
            report.append(f"{name}: in the baseline, absent from tokens.json")
            continue
        if token["$value"] != record["$value"]:
            report.append(f"{name}: {token['$value']!r} != baseline {record['$value']!r}")
        theirs = record["$extensions"]["tonaldepth"]["modes"]
        ours = token["$extensions"]["tonaldepth"]["modes"]
        for mode in sorted(set(theirs) | set(ours)):
            if ours.get(mode) != theirs.get(mode):
                report.append(f"{name} [{mode}]: {ours.get(mode)!r} != baseline {theirs.get(mode)!r}")
    return report


def reseed_compat(css: str, template: str) -> None:
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
        '  <link rel="stylesheet" href="../../../components/packages/core/dist/index.css">\n</head>',
        1,
    )
    dashboard = "<!-- Generated from approved offline HTML markup; styles come from the core package. -->\n" + dashboard
    DASHBOARD.parent.mkdir(parents=True, exist_ok=True)
    DASHBOARD.write_text(dashboard, encoding="utf-8")


def raw_template() -> str:
    outer = InventoryParser()
    outer.feed(SOURCE.read_text(encoding="utf-8"))
    return json.loads(next(item["content"] for item in outer.scripts if item["type"] == "__bundler/template"))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--check", action="store_true", help="report drift and exit non-zero; writes nothing")
    parser.add_argument("--reseed", action="store_true", help="also rewrite compat.css and the dashboard fixture (destructive)")
    args = parser.parse_args()

    records, css = baseline_records()
    document = json.loads(TOKENS.read_text(encoding="utf-8"))
    existing = document["tokens"]

    if args.check:
        report = drift(existing, records)
        skipped = sorted(BASELINE_EXCLUDES)
        if report:
            print(f"tokens.json differs from the baseline on {len(report)} value(s):\n")
            for line in report:
                print(f"  {line}")
            print(f"\nNot compared (owned here, not by the baseline): {', '.join(skipped)}")
            print("Run `pnpm tokens:import` to take the baseline values.")
            raise SystemExit(1)
        print(f"Baseline parity: {len(records) - len(skipped)} tokens match, "
              f"{len(existing) - len(records)} authored here, {len(skipped)} excluded.")
        return

    merged = merge(existing, records)
    document["tokens"] = merged
    # ensure_ascii=False: the hand-written descriptions use em-dashes, and escaping
    # them to \u2014 would churn every one of those lines on an otherwise no-op run.
    TOKENS.write_text(json.dumps(document, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Reconciled {len(records) - len(BASELINE_EXCLUDES)} baseline tokens into {len(merged)} total "
          f"({len(merged) - len(records)} authored here, {len(BASELINE_EXCLUDES)} excluded).")

    if args.reseed:
        reseed_compat(css, raw_template())
        print(f"Reseeded compat.css and the dashboard fixture from {len(css.encode('utf-8'))} CSS bytes")


if __name__ == "__main__":
    main()
