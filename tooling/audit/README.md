# Phase 0 HTML audit

The audit uses only the Python standard library. It treats the archived HTML as immutable input and produces deterministic forensic inventories.

Run from the repository root:

```powershell
python tooling/audit/audit_html.py
```

Optional paths:

```powershell
python tooling/audit/audit_html.py --source path\to\input.html --output path\to\output
```

Selector grouping and page-only flags are heuristics, not public-API or component decisions. Font payload hashes prove what is embedded; they do not prove redistribution rights.

