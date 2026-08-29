#!/usr/bin/env python3
"""Read-only, deterministic forensic audit of the TonalDepth offline HTML."""

from __future__ import annotations

import argparse
import base64
import csv
import gzip
import hashlib
import json
import re
import shutil
from collections import Counter, defaultdict
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote_to_bytes

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE = ROOT / "static" / "baselines" / "claude-html" / "TonalDepth Dashboard (offline).html"
DEFAULT_OUTPUT = ROOT / "static" / "artifacts" / "phase-0" / "current"

TOKEN_RE = re.compile(r"(?P<name>--td-[a-zA-Z0-9_-]+)\s*:\s*(?P<value>[^;}]+)")
TOKEN_NAME_RE = re.compile(r"--td-[a-zA-Z0-9_-]+")
CLASS_RE = re.compile(r"\.((?:td)-[a-zA-Z0-9_-]+)")
FONT_FACE_RE = re.compile(r"@font-face\s*\{(?P<body>.*?)\}", re.I | re.S)
DECL_RE = re.compile(r"([a-zA-Z-]+)\s*:\s*([^;}]*)")
URL_RE = re.compile(r"url\(\s*(['\"]?)(.*?)\1\s*\)", re.I | re.S)
DATA_URI_RE = re.compile(r"data:(?P<mime>[-\w.+]+/[-\w.+]+)(?P<meta>(?:;[-\w=.+]+)*?),(?P<data>[^\s'\")<>]+)", re.I)
HTTP_RE = re.compile(r"https?://[^\s'\"<>)]+", re.I)
BUNDLER_RE = re.compile(r"__bundler/[a-zA-Z0-9_./-]+")
PAGE_HINTS = {"app", "dashboard", "sidebar", "topbar", "shell", "page", "hero", "chart", "orders", "activity"}


class InventoryParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=False)
        self.tags = Counter()
        self.attrs = Counter()
        self.links: list[dict[str, str]] = []
        self.styles: list[str] = []
        self.scripts: list[dict[str, str]] = []
        self._capture: str | None = None
        self._attrs: dict[str, str] = {}
        self._buffer: list[str] = []

    def handle_starttag(self, tag, attrs):
        self.tags[tag] += 1
        values = {k: (v or "") for k, v in attrs}
        for key in values:
            self.attrs[key] += 1
        for key in ("src", "href", "poster"):
            if values.get(key):
                self.links.append({"tag": tag, "attribute": key, "value": values[key]})
        if tag in ("style", "script"):
            self._capture, self._attrs, self._buffer = tag, values, []

    def handle_data(self, data):
        if self._capture:
            self._buffer.append(data)

    def handle_endtag(self, tag):
        if tag != self._capture:
            return
        content = "".join(self._buffer)
        if tag == "style":
            self.styles.append(content)
        else:
            self.scripts.append({"type": self._attrs.get("type", ""), "id": self._attrs.get("id", ""), "content": content})
        self._capture, self._attrs, self._buffer = None, {}, []


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def write_csv(path: Path, fieldnames: list[str], rows: list[dict]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def decode_data_uri(match: re.Match) -> bytes:
    raw = match.group("data")
    if ";base64" in match.group("meta").lower():
        return base64.b64decode(raw, validate=False)
    return unquote_to_bytes(raw)


def stem_for(name: str) -> str:
    parts = name.removeprefix("td-").split("-")
    return "-".join(parts[:2]) if len(parts) > 1 else parts[0]


def clean_css_string(value: str) -> str:
    return value.replace('\\"', '"').replace("\\'", "'").strip().strip("'\"")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    source = args.source.resolve()
    output = args.output.resolve()
    before = source.read_bytes()
    before_hash = sha256_bytes(before)
    text = before.decode("utf-8", errors="replace")

    parsed = InventoryParser()
    parsed.feed(text)
    css = "\n".join(parsed.styles)
    scan_text = text  # bundled templates contain additional CSS evidence
    manifest_script = next((item for item in parsed.scripts if item["type"] == "__bundler/manifest"), None)
    manifest_data = json.loads(manifest_script["content"]) if manifest_script else {}

    all_token_names = sorted(set(TOKEN_NAME_RE.findall(scan_text)))
    token_values: dict[str, Counter] = defaultdict(Counter)
    for match in TOKEN_RE.finditer(scan_text):
        token_values[match.group("name")][" ".join(match.group("value").split())] += 1
    token_rows = []
    for name in all_token_names:
        values = token_values[name]
        token_rows.append({
            "token": name,
            "declaration_count": sum(values.values()),
            "unique_value_count": len(values),
            "values": " | ".join(f"{value} [{count}]" for value, count in sorted(values.items())) if values else "",
            "conflict_candidate": "yes" if len(values) > 1 else "no",
        })

    class_counts = Counter(CLASS_RE.findall(scan_text))
    selector_rows = []
    for name in sorted(class_counts):
        stem = stem_for(name)
        page_only = "yes" if any(hint in name.split("-") for hint in PAGE_HINTS) else "review"
        selector_rows.append({"class": f".{name}", "occurrences": class_counts[name], "candidate_group": stem, "page_only_candidate": page_only})

    data_matches = list(DATA_URI_RE.finditer(scan_text))
    data_rows = []
    for index, match in enumerate(data_matches, 1):
        try:
            payload = decode_data_uri(match)
            digest, size, error = sha256_bytes(payload), len(payload), ""
        except Exception as exc:  # malformed evidence is still inventoried
            digest, size, error = "", 0, type(exc).__name__
        data_rows.append({"id": index, "mime": match.group("mime").lower(), "encoding": "base64" if ";base64" in match.group("meta").lower() else "percent/plain", "decoded_bytes": size, "sha256": digest, "decode_error": error})

    font_rows = []
    for index, match in enumerate(FONT_FACE_RE.finditer(scan_text), 1):
        declarations = {k.lower(): " ".join(v.split()) for k, v in DECL_RE.findall(match.group("body"))}
        src = declarations.get("src", "")
        url_match = URL_RE.search(src)
        source_reference = clean_css_string(url_match.group(2)) if url_match else ""
        payload_match = DATA_URI_RE.search(src)
        payload_hash = payload_size = ""
        if payload_match:
            try:
                payload = decode_data_uri(payload_match)
                payload_hash, payload_size = sha256_bytes(payload), str(len(payload))
            except Exception:
                pass
        elif source_reference in manifest_data:
            entry = manifest_data[source_reference]
            packed = base64.b64decode(entry.get("data", ""))
            payload = gzip.decompress(packed) if entry.get("compressed") else packed
            payload_hash, payload_size = sha256_bytes(payload), str(len(payload))
        font_rows.append({
            "face": index,
            "family": clean_css_string(declarations.get("font-family", "")),
            "style": declarations.get("font-style", "normal"),
            "weight": declarations.get("font-weight", "normal"),
            "display": declarations.get("font-display", ""),
            "source_kind": "embedded-data-uri" if payload_match else ("bundler-manifest" if source_reference in manifest_data else ("external-or-relative" if src else "missing")),
            "source_reference": source_reference,
            "source_mime": payload_match.group("mime").lower() if payload_match else manifest_data.get(source_reference, {}).get("mime", ""),
            "payload_bytes": payload_size,
            "payload_sha256": payload_hash,
            "license_status": "unverified",
        })

    link_rows = sorted(parsed.links, key=lambda row: (row["tag"], row["attribute"], row["value"]))
    external_urls = sorted(set(HTTP_RE.findall(scan_text)))
    bundler_markers = sorted(set(BUNDLER_RE.findall(scan_text)))
    scripts = []
    for index, item in enumerate(parsed.scripts, 1):
        body = item["content"].encode("utf-8")
        scripts.append({"index": index, "id": item["id"], "type": item["type"], "bytes": len(body), "sha256": sha256_bytes(body)})
    styles = [{"index": index, "bytes": len(value.encode("utf-8")), "sha256": sha256_bytes(value.encode("utf-8"))} for index, value in enumerate(parsed.styles, 1)]

    bundle_rows = []
    if manifest_data:
        for resource_id, entry in sorted(manifest_data.items()):
            encoded = entry.get("data", "")
            packed = base64.b64decode(encoded) if encoded else b""
            unpack_error = ""
            try:
                unpacked = gzip.decompress(packed) if entry.get("compressed") else packed
            except Exception as exc:
                unpacked, unpack_error = b"", type(exc).__name__
            bundle_rows.append({
                "resource_id": resource_id,
                "mime": entry.get("mime", ""),
                "compressed": str(bool(entry.get("compressed"))).lower(),
                "packed_bytes": len(packed),
                "packed_sha256": sha256_bytes(packed),
                "unpacked_bytes": len(unpacked),
                "unpacked_sha256": sha256_bytes(unpacked) if unpacked else "",
                "unpack_error": unpack_error,
            })

    if output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True)
    write_csv(output / "tokens.csv", ["token", "declaration_count", "unique_value_count", "values", "conflict_candidate"], token_rows)
    write_csv(output / "selectors.csv", ["class", "occurrences", "candidate_group", "page_only_candidate"], selector_rows)
    write_csv(output / "fonts.csv", ["face", "family", "style", "weight", "display", "source_kind", "source_reference", "source_mime", "payload_bytes", "payload_sha256", "license_status"], font_rows)
    write_csv(output / "data-resources.csv", ["id", "mime", "encoding", "decoded_bytes", "sha256", "decode_error"], data_rows)
    write_csv(output / "linked-resources.csv", ["tag", "attribute", "value"], link_rows)
    write_csv(output / "scripts.csv", ["index", "id", "type", "bytes", "sha256"], scripts)
    write_csv(output / "styles.csv", ["index", "bytes", "sha256"], styles)
    write_csv(output / "bundled-resources.csv", ["resource_id", "mime", "compressed", "packed_bytes", "packed_sha256", "unpacked_bytes", "unpacked_sha256", "unpack_error"], bundle_rows)
    write_csv(output / "markup-tags.csv", ["tag", "count"], [{"tag": key, "count": value} for key, value in sorted(parsed.tags.items())])

    after_hash = sha256_bytes(source.read_bytes())
    manifest = {
        "schema_version": 1,
        # Repo-relative so the manifest is identical on every machine — an
        # absolute path churns the artefact per checkout and leaks a username.
        # The SHA-256 pair below is what actually identifies the audited bytes.
        "source": str(source.relative_to(ROOT)) if source.is_relative_to(ROOT) else str(source),
        "source_bytes": len(before),
        "source_sha256_before": before_hash,
        "source_sha256_after": after_hash,
        "source_unchanged": before_hash == after_hash,
        "counts": {
            "unique_td_tokens": len(token_rows),
            "declared_td_tokens": sum(row["declaration_count"] > 0 for row in token_rows),
            "token_declarations": sum(row["declaration_count"] for row in token_rows),
            "token_conflict_candidates": sum(row["conflict_candidate"] == "yes" for row in token_rows),
            "unique_td_classes": len(selector_rows),
            "font_faces": len(font_rows),
            "font_families": sorted(set(row["family"] for row in font_rows if row["family"])),
            "data_resources": len(data_rows),
            "bundled_resources": len(bundle_rows),
            "linked_resources": len(link_rows),
            "style_blocks": len(styles),
            "script_blocks": len(scripts),
        },
        "bundler_markers": bundler_markers,
        "external_urls": external_urls,
        "limitations": [
            "Class candidate grouping and page-only flags are heuristic.",
            "Repeated token values may represent valid theme overrides, bundled duplicate templates, or conflicts.",
            "Embedded font hashes do not establish redistribution licenses.",
            "The owner selected the offline HTML typography mapping as canonical; Storybook must later be reconciled to it.",
        ],
    }
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    report = f"""# Phase 0 extraction report

## Verified evidence

- Source bytes: {len(before)}
- Source SHA-256: `{before_hash}`
- Source unchanged during audit: **{str(before_hash == after_hash).lower()}**
- Unique `--td-*` tokens: {len(token_rows)}
- Declared `--td-*` tokens: {sum(row["declaration_count"] > 0 for row in token_rows)}
- Unique `.td-*` classes: {len(selector_rows)}
- Font faces: {len(font_rows)}
- Embedded data resources: {len(data_rows)}
- Bundler-manifest resources: {len(bundle_rows)}
- Style blocks: {len(styles)}
- Script blocks: {len(scripts)}

## Decision state

- **Confirmed:** these inventories describe evidence present in the archived HTML.
- **Prepared:** token conflicts and page-only selector candidates are flagged for review.
- **Confirmed:** the owner selected the offline HTML font-role mapping as canonical.
- **Blocked:** exact Google Fonts licenses/provenance must still be mapped to audited binary hashes.
- **Deferred:** promotion to canonical tokens, public selectors, components, or packages.

No inventory row is a production API or implementation claim.
"""
    (output / "REPORT.md").write_text(report, encoding="utf-8")
    print(json.dumps(manifest["counts"], indent=2))
    if before_hash != after_hash:
        raise RuntimeError("Source changed during audit")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
