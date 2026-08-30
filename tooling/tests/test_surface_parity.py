"""Keep the four places a component lives from drifting apart.

A component exists in four artefacts and nothing structurally binds them:

    components/packages/react/src/     the npm package  — the source of truth
    components/registry/tonaldepth/    the shadcn copy-to-source variant
    registry.json           the registry manifest
    apps/docs/src/main.tsx  the docs index

Adding a component to the first and forgetting the fourth is silent: the build
is green, the tests pass, and the component is simply absent from the docs. That
happened on 2026-08-27 with the six marketing components. These tests make it
loud instead.
"""

from __future__ import annotations

import json
import re
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PACKAGE_SRC = ROOT / "components/packages/react/src"
REGISTRY_SRC = ROOT / "components/registry/tonaldepth"
MANIFEST = ROOT / "registry.json"
DOCS = ROOT / "apps/docs/src/main.tsx"

# Registry items that are not one-to-one with a package module, because the
# package groups several components into one file.
ITEM_TO_MODULE = {
    "textarea": "input",
    "checkbox": "selection",
    "radio": "selection",
    "switch": "selection",
    "kpi": "kpi-card",
}

# Docs entries that are composition demos rather than registry items. They have
# no `.tsx` to install and are documented on purpose.
# `lamp` is the interaction pattern IconButton, Button, Alert and SocialButton
# all ride. It is a page about a technique, not a component to install.
# `overlays` is the same shape: the containing-block rule every scrim, sheet and
# popover in the library obeys, written once instead of on seven pages.
DOC_ONLY = {"forms", "feedback", "ordered-states", "lamp", "overlays"}

# `tokens` ships a stylesheet, not a component.
STYLE_ONLY = {"tokens"}

# The icon set is two modules and neither is a component: `icons.ts` resolves a
# role name to a glyph, and `td-icons.tsx` draws the glyphs TonalDepth owns.
# `brands.ts` / `td-brands.tsx` are the sibling brand-logo family — same shape,
# generated from tooling/brands, but colour-*preserving* and never routed
# through icons.ts. The component rules — no raw `<svg>`, colour-neutral, one
# registry item each — are about components, and applying them to any of these
# asset modules would ban the marks from existing.
ICON_MODULES = {"icons", "td-icons", "brands", "td-brands"}

# Components with no props of their own — they pass native DOM attributes
# through and nothing else. An empty props table is correct for these, and the
# docs say so in words rather than rendering a blank table.
NO_OWN_PROPS = {"table", "lamp", "overlays"}

# Classes a component emits purely so a consumer can target them — a router
# link, a mega-menu trigger. They carry no rule on purpose, and are listed here
# rather than given an empty one so the intent is written down.
MARKER_CLASSES = {"td-react-sitenav-link", "td-react-sitenav-trigger",
                  "td-registry-sitenav-link", "td-registry-sitenav-trigger"}


def registry_items() -> list[dict]:
    return json.loads(MANIFEST.read_text(encoding="utf-8"))["items"]


# A Doc entry is `{id:"x",name:"…",group:"…"`. All three keys are required to
# match, because each looser anchor has already been defeated by a preview
# carrying real data: `{id:"` counted every SideTabs tab item, and `{id:"…",name:"`
# counted every node in the FileTree preview, whose nodes are `{id, name}` too.
# `group:` is the first key no component's own props plausibly carry.
DOC_ENTRY = re.compile(r'\{id:"([a-z0-9-]+)",name:"[^"]*",group:"')


def code_only(source: str) -> str:
    """Source with comments removed, for rules about what the code does.

    The icon rules are written down in the icon modules themselves, so the
    strings they ban — `<svg`, a hardcoded hex — appear in the prose that bans
    them. Scanning the raw file makes the documentation the offence.
    """
    return re.sub(r"//[^\n]*", "", re.sub(r"/\*.*?\*/", "", source, flags=re.S))


def doc_ids() -> list[str]:
    return DOC_ENTRY.findall(DOCS.read_text(encoding="utf-8"))


def exported_symbols() -> set[str]:
    index = (PACKAGE_SRC / "index.ts").read_text(encoding="utf-8")
    symbols: set[str] = set()
    for block in re.findall(r"export \{([^}]*)\} from", index):
        for name in block.split(","):
            name = name.strip()
            if not name or name.startswith("type "):
                continue
            symbols.add(name)
    return symbols


def expected_registry_name(symbol: str) -> str:
    """`Button` -> `TonalDepthButton`; the `useToast` hook -> `useTonalDepthToast`."""
    if symbol.startswith("use"):
        return "useTonalDepth" + symbol[3:]
    return "TonalDepth" + symbol


def class_expressions(source: str) -> list[str]:
    """The value of every `className=` in a component, as raw source.

    Scanning the whole file instead would pick up any `td-`-prefixed string:
    ThemeToggle's localStorage key is `"td-theme"`, chosen to match the design
    system's own runtime, and a whole-file scan reported it as an unstyled class.
    """
    out: list[str] = []
    for match in re.finditer(r"className=", source):
        i = match.end()
        if i >= len(source):
            continue
        if source[i] == '"':
            end = source.index('"', i + 1)
            out.append(source[i:end + 1])
        elif source[i] == "{":
            depth, j = 0, i
            while j < len(source):
                if source[j] == "{":
                    depth += 1
                elif source[j] == "}":
                    depth -= 1
                    if not depth:
                        break
                j += 1
            out.append(source[i:j + 1])
    return out


def emitted_classes(source: str) -> set[str]:
    """Every `.td-*` class the component puts on an element.

    The `td-react-*` / `td-registry-*` modifier namespaces are INCLUDED. They
    were skipped until 2026-08-28 on the grounds that the two builds "differ by
    design" — but they differ only by prefix, and each side is checked against
    its own stylesheets, never against the other's. Skipping them meant the one
    namespace a registry stylesheet is hand-authored in was the one namespace
    nothing checked, and six copy-to-source items drifted behind their
    components in silence.
    """
    found: set[str] = set()
    for expression in class_expressions(source):
        for literal in re.findall(r'"([^"]*)"', expression):
            for token in literal.split():
                if token.startswith("td-"):
                    found.add(token)
        for prefix in re.findall(r"`(td-[a-z0-9-]+)\$\{", expression):
            found.add(prefix + "*")
    return found


def emitted_classes_shared(source: str) -> set[str]:
    """`emitted_classes` without the two modifier namespaces.

    For the one test that compares the builds *to each other*, where the
    prefixes differ by design. Every other caller wants the full set — each
    build is checked against its own stylesheets, so the namespace belongs in.
    """
    return {c for c in emitted_classes(source) if not c.startswith(("td-react-", "td-registry-"))}

CORE_CSS = ROOT / "components/packages/core/src/compat.css"


def styled_classes(*paths) -> set[str]:
    """Every `.td-*` class the given stylesheets declare a rule for.

    Comments are stripped first: the design system's CSS discusses class names
    in prose, and matching those reports rules that do not exist.
    """
    found: set[str] = set()
    for path in paths:
        if not path.exists():
            continue
        css = re.sub(r"/\*.*?\*/", "", path.read_text(encoding="utf-8"), flags=re.S)
        found.update(re.findall(r"\.(td-[A-Za-z0-9_-]+)", css))
    return found


def emitted_class_prefixes(source: str) -> set[str]:
    """Classes built from a template literal, e.g. `td-mk-cta--${align}`."""
    return {p for expression in class_expressions(source)
            for p in re.findall(r"`(td-[a-z0-9-]+)\$\{", expression)}



# A component owns its own name's class family even when the class never
# appears as a literal in its `.tsx` — Toast's variant classes are built in the
# provider, not at the render site. Without this the check reports a component
# against itself.
OWN_FAMILY_ALIASES = {
    "kpi": ["kpi"], "page-patterns": ["panel", "page-state", "pattern", "empty"],
    "icon-button": ["iconbutton", "glowicon"], "theme-toggle": ["theme-toggle", "iconbtn"],
    "site-navigation": ["sitenav", "nav", "mega"], "split-button": ["split", "splitbtn"],
    "filament-button": ["filament"], "side-tabs": ["filament", "sidetabs"],
    "search-bar": ["search"], "rect-title": ["rect-title", "h1", "h2", "h3"],
    "form-field": ["field", "form"], "dropdown-menu": ["dropdown"],
    "chart-container": ["chart"], "application-shell": ["shell", "app"],
    "desktop-navigation": ["nav"], "article-card": ["article"], "case-card": ["case"],
    "feature-card": ["feature"], "comparison-table": ["compare"], "cta-banner": ["cta"],
    "filter-bar": ["filter"], "table": ["table"],
}


def _norm_ns(text: str) -> str:
    """Collapse the two modifier namespaces so the builds can be compared."""
    return re.sub(r"\s+", " ", re.sub(r"td-(react|registry)-", "td-NS-", text)).strip()


def _split_top_level(selector_list: str) -> list[str]:
    """Split on commas outside any bracket — `:is(a, b)` is one selector."""
    parts, depth, current = [], 0, ""
    for ch in selector_list:
        if ch in "([":
            depth += 1
        elif ch in ")]":
            depth -= 1
        if ch == "," and depth == 0:
            parts.append(current); current = ""
        else:
            current += ch
    if current.strip():
        parts.append(current)
    return parts


def _selectors(path) -> set[str]:
    """Every individual selector a stylesheet declares, namespace-normalised."""
    out: set[str] = set()
    css = re.sub(r"/\*.*?\*/", "", path.read_text(encoding="utf-8"), flags=re.S)
    for rule in re.finditer(r"([^{}]+)\{[^{}]*\}", css):
        for selector in _split_top_level(rule.group(1)):
            normalised = _norm_ns(selector)
            if normalised and not normalised.startswith("@"):
                out.add(normalised)
    return out


def _own_stems(item_name: str, source: str) -> set[str]:
    """Every class family the module itself names.

    Deliberately a broad literal scan rather than `emitted_classes`: Button
    holds its base classes (`td-primary`, `td-coloured`) in a variant map, not
    in a `className` expression, so the narrow scan reports the component
    against its own base.
    """
    literals: set[str] = set()
    body = code_only(source)
    for match in re.finditer(r'"(td-[A-Za-z0-9_ -]*)"', body):
        literals.update(t for t in match.group(1).split() if t.startswith("td-"))
    literals.update(m.group(1) for m in re.finditer(r"`(td-[a-z0-9-]+)\$\{", body))
    stems = {_norm_ns(c).split("--")[0] for c in literals}
    for token in [item_name.replace("-", ""), item_name] + OWN_FAMILY_ALIASES.get(item_name, []):
        stems |= {f"td-{token}", f"td-NS-{token}"}
    return stems


class SurfaceParityTests(unittest.TestCase):
    def test_every_registry_item_is_documented(self):
        missing = [item["name"] for item in registry_items()
                   if item["name"] not in STYLE_ONLY and item["name"] not in doc_ids()]
        self.assertEqual([], missing, f"registry items with no docs entry: {missing}")

    def test_every_documented_component_has_a_registry_item(self):
        names = {item["name"] for item in registry_items()}
        missing = [doc_id for doc_id in doc_ids() if doc_id not in names and doc_id not in DOC_ONLY]
        self.assertEqual([], missing, f"docs entries with no registry item: {missing}")

    def test_every_registry_item_ships_its_files(self):
        problems = []
        for item in registry_items():
            for entry in item["files"]:
                if not (ROOT / entry["path"]).exists():
                    problems.append(entry["path"])
            if item["name"] not in STYLE_ONLY:
                if not (REGISTRY_SRC / f"{item['name']}.tsx").exists():
                    problems.append(f"components/registry/tonaldepth/{item['name']}.tsx")
                if not (REGISTRY_SRC / f"{item['name']}.css").exists():
                    problems.append(f"components/registry/tonaldepth/{item['name']}.css")
        self.assertEqual([], problems, f"registry files missing from disk: {problems}")

    def test_every_package_export_reaches_the_registry(self):
        """A component exported from the package but absent from the registry is
        one half of the library shipping without the other."""
        prefixed = set()
        for item in registry_items():
            if item["name"] in STYLE_ONLY:
                continue
            source = (REGISTRY_SRC / f"{item['name']}.tsx").read_text(encoding="utf-8")
            prefixed.update(re.findall(r"export (?:const|function) (\w+)", source))
        missing = sorted(name for name in exported_symbols() if expected_registry_name(name) not in prefixed)
        self.assertEqual([], missing, f"package exports with no registry equivalent: {missing}")

    def test_registry_keeps_its_own_modifier_namespace(self):
        """`td-react-*` is the package's scope, `td-registry-*` is the registry's.

        A registry file on the package's namespace styles a class it does not
        emit, or emits one it does not style. Both halves ship, so the mismatch
        is invisible until a consumer renders it.
        """
        strays = sorted(path.name for path in REGISTRY_SRC.iterdir()
                        if path.suffix in {".tsx", ".css"} and "td-react-" in path.read_text(encoding="utf-8"))
        self.assertEqual([], strays, f"registry files using the package namespace: {strays}")

    def test_registry_is_generated_from_the_package(self):
        """`components/registry/tonaldepth/*.tsx` is generated. A hand edit is lost on the
        next run, so a stale tree means someone edited the wrong copy."""
        result = subprocess.run(["node", str(ROOT / "tooling/registry/generate.mjs"), "--check"],
                                cwd=ROOT, capture_output=True, text=True)
        self.assertEqual(0, result.returncode, result.stdout + result.stderr)

    def test_registry_carries_every_package_import_it_still_calls(self):
        """A generated item that calls what it never imported is a runtime crash
        in a consumer's tree, and it ships silently.

        `createPortal` found this: the generator only ever rebuilt the `react`
        import, so portalling SiteNavigation's scrim produced a registry item
        calling an undefined function. Nothing in the build objected — the item
        is not typechecked here and the package copy was fine.

        Checked for the packages a component may legitimately reach for beyond
        React itself. Phosphor and the brand marks are excluded: those are
        rewritten on the way across on purpose.
        """
        for item in registry_items():
            if item["name"] in STYLE_ONLY:
                continue
            source = (REGISTRY_SRC / f"{item['name']}.tsx").read_text(encoding="utf-8")
            body = re.sub(r"^import .*$", "", source, flags=re.MULTILINE)
            for package, symbols in (("react-dom", ("createPortal", "flushSync", "createRoot")),):
                called = sorted(name for name in symbols if re.search(rf"\b{name}\s*\(", body))
                if not called:
                    continue
                imported = re.search(rf'import \{{([^}}]*)\}} from "{package}";', source)
                have = {part.strip() for part in imported.group(1).split(",")} if imported else set()
                self.assertLessEqual(set(called), have,
                                     f"{item['name']}.tsx calls {called} without importing it from {package}")

    def test_docs_props_are_generated_from_the_package(self):
        """The props table is the component's interface. Retyped by hand it goes
        stale silently — Button's documented default said "primary" for as long
        as the component shipped "secondary"."""
        result = subprocess.run(["node", str(ROOT / "tooling/docs/props.mjs"), "--check"],
                                cwd=ROOT, capture_output=True, text=True)
        self.assertEqual(0, result.returncode, result.stdout + result.stderr)


    def test_cross_component_rules_reach_the_registry(self):
        """A package rule that reaches ANOTHER component's class must be mirrored.

        `Frame` flattens a table wrapper, a bento panel and a chart card on the
        way into its well, so data stays recessed under chrome ([[L32]]). None
        of those classes is emitted by `frame.tsx`, so every class-parity check
        here is structurally blind to the rule going missing — and it did go
        missing from the registry copy, along with two of `page-patterns`'.

        This is the narrow form on purpose. A blanket selector diff fails on 13
        items that differ legitimately: the package writes `(0,2,0)` compounds
        to beat a consumer's own base copy, while the registry declares the base
        directly because it *is* the base.
        """
        missing = {}
        for item in registry_items():
            name = item["name"]
            if name in STYLE_ONLY:
                continue
            module = ITEM_TO_MODULE.get(name, name)
            package_css = PACKAGE_SRC / f"{module}.css"
            package_tsx = PACKAGE_SRC / f"{module}.tsx"
            registry_css = REGISTRY_SRC / f"{name}.css"
            if not (package_css.exists() and package_tsx.exists() and registry_css.exists()):
                continue
            own = _own_stems(name, package_tsx.read_text(encoding="utf-8"))
            mirrored = _selectors(registry_css)
            gaps = []
            for selector in _selectors(package_css):
                classes = re.findall(r"\.(td-[A-Za-z0-9_-]+)", selector)
                if not classes:
                    continue
                foreign = [c for c in classes
                           if not any(c.split("--")[0] == o or c.split("--")[0].startswith(o + "-") for o in own)]
                if foreign and selector not in mirrored:
                    gaps.append(selector)
            if gaps:
                missing[name] = sorted(gaps)
        self.assertEqual({}, missing, f"cross-component rules missing from the registry: {missing}")

    def test_registry_emits_no_class_the_package_does_not(self):
        """The two builds must agree on the `.td-*` contract.

        The registry variant re-declares the design system's classes in its own
        stylesheet, so a class here that the package never emits means the two
        have drifted and a consumer's rendering depends on which one they chose.
        """
        drift = {}
        for item in registry_items():
            name = item["name"]
            if name in STYLE_ONLY:
                continue
            module = ITEM_TO_MODULE.get(name, name)
            package_file = PACKAGE_SRC / f"{module}.tsx"
            if not package_file.exists():
                continue
            extra = emitted_classes_shared((REGISTRY_SRC / f"{name}.tsx").read_text(encoding="utf-8")) - emitted_classes_shared(
                package_file.read_text(encoding="utf-8"))
            if extra:
                drift[name] = sorted(extra)
        self.assertEqual({}, drift, f"registry emits classes the package does not: {drift}")


class StylingParityTests(unittest.TestCase):
    """Every class a component puts on an element has to be styled by something
    that ships with it. A class with no rule is invisible until a consumer
    renders it — which is how `size="lg"` reached production unstyled."""

    def test_package_components_style_every_class_they_emit(self):
        available = styled_classes(*PACKAGE_SRC.glob("*.css"), CORE_CSS)
        unstyled = {}
        for path in sorted(PACKAGE_SRC.glob("*.tsx")):
            if ".test." in path.name:
                continue
            source = path.read_text(encoding="utf-8")
            exact = {c for c in emitted_classes(source) if not c.endswith("*")}
            missing = sorted(c for c in exact if c not in available and c not in MARKER_CLASSES)
            prefixes = sorted(p for p in emitted_class_prefixes(source)
                              if not any(a.startswith(p) for a in available))
            if missing or prefixes:
                unstyled[path.stem] = missing + [f"{p}*" for p in prefixes]
        self.assertEqual({}, unstyled, f"package classes with no rule anywhere: {unstyled}")

    def test_registry_components_are_self_contained(self):
        """A registry item is copied into a consumer's tree on its own. It has no
        `tonaldepth-core` to inherit from, so its own stylesheet must carry every
        class it emits."""
        unstyled = {}
        for item in registry_items():
            if item["name"] in STYLE_ONLY:
                continue
            source = (REGISTRY_SRC / f"{item['name']}.tsx").read_text(encoding="utf-8")
            available = styled_classes(REGISTRY_SRC / f"{item['name']}.css")
            exact = {c for c in emitted_classes(source) if not c.endswith("*")}
            missing = sorted(c for c in exact if c not in available and c not in MARKER_CLASSES)
            prefixes = sorted(p for p in emitted_class_prefixes(source)
                              if not any(a.startswith(p) for a in available))
            if missing or prefixes:
                unstyled[item["name"]] = missing + [f"{p}*" for p in prefixes]
        self.assertEqual({}, unstyled, f"registry items missing rules for classes they emit: {unstyled}")


class CompletenessTests(unittest.TestCase):
    """Nothing may be half-present: a component the generator skips, a docs page
    with an empty props table, or a module nothing exports."""

    def test_every_registry_item_is_generated(self):
        generator = (ROOT / "tooling/registry/generate.mjs").read_text(encoding="utf-8")
        configured = set(re.findall(r'^\s*"([a-z0-9-]+)": \{ module:', generator, re.M))
        missing = sorted(item["name"] for item in registry_items()
                         if item["name"] not in STYLE_ONLY and item["name"] not in configured)
        self.assertEqual([], missing, f"registry items absent from ITEMS in generate.mjs: {missing}")

    def test_registry_items_declare_the_npm_packages_they_import(self):
        """A manifest dependency is what `shadcn add` installs.

        Declaring one an item no longer imports adds a package to a consumer's
        tree for nothing; missing one leaves the pasted file unresolvable. Both
        happen the moment a glyph moves between the icon libraries — a role
        that becomes TD's is inlined, and its Phosphor dependency goes with it.
        """
        wrong = {}
        for item in registry_items():
            if item["name"] in STYLE_ONLY:
                continue
            # `code_only`, because a prose comment containing the word `from`
            # ahead of a quoted phrase reads as an import otherwise — which it
            # did, reporting a sentence as an npm package.
            source = code_only((REGISTRY_SRC / f"{item['name']}.tsx").read_text(encoding="utf-8"))
            # `react` and `react-dom` are peers of any React DOM application, so
            # neither is a package `shadcn add` should install. `react-dom` joins
            # the list because every overlay in the library portals itself with
            # `createPortal`, and declaring it would put a peer in a consumer's
            # dependency list for nothing.
            imported = {package for package in re.findall(r'from "([^.][^"]*)"', source)
                        if package not in {"react", "react-dom"}}
            declared = set(item.get("dependencies", []))
            if imported != declared:
                wrong[item["name"]] = {"imports": sorted(imported), "declares": sorted(declared)}
        self.assertEqual({}, wrong, f"registry items whose dependencies disagree with their imports: {wrong}")

    def test_every_documented_component_has_a_props_table(self):
        tables = json.loads((ROOT / "apps/docs/src/props.generated.json").read_text(encoding="utf-8"))
        empty = sorted(doc_id for doc_id in doc_ids()
                       if doc_id not in DOC_ONLY and doc_id not in NO_OWN_PROPS and not tables.get(doc_id))
        self.assertEqual([], empty, f"documented components with no props table: {empty}")

    def test_every_documented_component_has_a_live_preview(self):
        docs = DOCS.read_text(encoding="utf-8")
        without = [doc_id for doc_id in doc_ids()
                   if "preview:" not in DOC_ENTRY.split(docs)[DOC_ENTRY.findall(docs).index(doc_id) * 2 + 2]]
        self.assertEqual([], without, f"docs entries with no preview: {without}")

    def test_every_exported_component_reaches_the_docs(self):
        """A component in the library that the docs never render does not exist.

        `test_every_registry_item_is_documented` only covers registry items, so
        a component exported from the package without one — or a sub-part like
        `CardHeader` or `FooterGrid`, which are documented inside a parent
        rather than on a page of their own — was invisible to every check here.
        Asked directly in 2026-08-29: "are there any missing components that
        have been created and not added to the docs". There were none, and this
        is what keeps that answer true.

        Rendered inside a parent entry counts. What does not count is a
        component nothing in the docs ever puts on screen.
        """
        index = (PACKAGE_SRC / "index.ts").read_text(encoding="utf-8")
        exported: set[str] = set()
        for block in re.findall(r"export \{([^}]*)\} from", index):
            for name in block.split(","):
                name = name.strip()
                if name and not name.startswith("type "):
                    exported.add(name.split(" as ")[-1].strip())
        for module in re.findall(r'export \* from "\./([a-z-]+)"', index):
            for suffix in (".tsx", ".ts"):
                path = PACKAGE_SRC / f"{module}{suffix}"
                if path.exists():
                    exported.update(re.findall(r"^export (?:const|function) ([A-Za-z_$][\w$]*)",
                                               path.read_text(encoding="utf-8"), re.M))
                    break
        # Components only: the icon roles are held to their own index by
        # `test_the_docs_index_previews_every_role`, and the constants are not
        # components at all.
        components = {n for n in exported
                      if n[:1].isupper() and not n.endswith("Icon") and not n.isupper()}

        docs = DOCS.read_text(encoding="utf-8")
        documented = set(re.findall(r'\{id:"[a-z0-9-]+",name:"([^"]*)"', docs))
        missing = sorted(name for name in components
                         if name not in documented and not re.search(rf"<{name}[ />]", docs))
        self.assertEqual([], missing, f"components the docs never render: {missing}")

    def test_the_aggregate_stylesheet_imports_every_component(self):
        """`styles.css` is the one-file entry, and it had drifted 25 behind.

        Each component imports its own `.css`, so a bundler picks the rules up
        either way and the docs app looked correct — which is exactly why this
        went unnoticed. A consumer serving the aggregate stylesheet on its own,
        which is what the file exists for, was getting 25 unstyled components:
        every one added since `theme-toggle`.
        """
        styles = (PACKAGE_SRC / "styles.css").read_text(encoding="utf-8")
        listed = set(re.findall(r'@import "\./([a-z-]+)\.css"', styles))
        shipped = {path.stem for path in PACKAGE_SRC.glob("*.css")} - {"styles"}
        missing = sorted(shipped - listed)
        self.assertEqual([], missing, f"component stylesheets absent from styles.css: {missing}")
        stale = sorted(listed - shipped)
        self.assertEqual([], stale, f"styles.css imports stylesheets that no longer exist: {stale}")

    def test_every_package_module_is_exported(self):
        """Every module is reachable from index.ts, directly or through one that is.

        Followed transitively rather than read off index.ts alone: `td-icons`
        is public through `icons`, and a module the index reaches only at one
        remove is exported just as surely as one it names itself.
        """
        reachable: set[str] = set()
        frontier = ["index"]
        while frontier:
            module = frontier.pop()
            for name in (".ts", ".tsx"):
                path = PACKAGE_SRC / f"{module}{name}"
                if not path.exists():
                    continue
                for reference in re.findall(r'from "\./([a-z-]+)"', path.read_text(encoding="utf-8")):
                    if reference not in reachable:
                        reachable.add(reference)
                        frontier.append(reference)
        modules = {path.stem for path in PACKAGE_SRC.glob("*.tsx") if ".test." not in path.name}
        orphans = sorted(modules - reachable)
        self.assertEqual([], orphans, f"component modules nothing exports: {orphans}")




class IconSystemTests(unittest.TestCase):
    """Phosphor is the only icon library. One source, one weight for lamps.

    The rule is not aesthetic. A second icon set drifts in stroke weight and
    optical size the moment two people add icons independently, and the lamp
    pattern needs SOLID marks specifically: a glow traces the alpha edge of
    what it lights, so an outline glyph glows as a hollow outline and reads as
    a smudge rather than a lit filament.
    """

    def _components(self):
        for path in sorted(PACKAGE_SRC.glob("*.tsx")):
            if ".test." in path.name or path.stem in ICON_MODULES:
                continue
            yield path

    def test_no_component_draws_its_own_svg(self):
        offenders = {}
        for path in self._components():
            source = code_only(path.read_text(encoding="utf-8"))
            count = source.count("<svg")
            if count:
                offenders[path.stem] = count
        self.assertEqual({}, offenders,
                         f"components drawing raw <svg> instead of importing from ./icons: {offenders}")

    def test_the_td_set_is_the_only_place_a_glyph_is_drawn(self):
        """The exemption is glyph-set wide, and this is what holds it there.

        `td-icons.tsx` draws the UI glyphs and `td-brands.tsx` draws the brand
        marks — drawing is what both are for. Nothing else in the package may,
        including `icons.ts` / `brands.ts`, which resolve names and do not author
        the artwork.
        """
        drawing = sorted(path.name for path in PACKAGE_SRC.glob("*.ts*")
                         if ".test." not in path.name and "<svg" in code_only(path.read_text(encoding="utf-8")))
        self.assertEqual(["td-brands.tsx", "td-icons.tsx"], drawing,
                         f"only the TD glyph sets may draw a glyph; found: {drawing}")

    def test_no_second_icon_library(self):
        banned = ("lucide", "heroicons", "@fortawesome", "react-icons", "feather-icons")
        offenders = {}
        for path in self._components():
            imports = "\n".join(line for line in path.read_text(encoding="utf-8").splitlines()
                                 if line.lstrip().startswith(("import ", "export ")) and " from " in line).lower()
            hits = [name for name in banned if name in imports]
            if hits:
                offenders[path.stem] = hits
        self.assertEqual({}, offenders, f"a second icon library appeared: {offenders}")

    def test_icons_come_only_through_the_shared_module(self):
        """No component imports Phosphor directly — everything routes through
        `./icons`, so swapping a glyph is one line in one file."""
        offenders = []
        for path in self._components():
            if "@phosphor-icons/react" in path.read_text(encoding="utf-8"):
                offenders.append(path.stem)
        self.assertEqual([], offenders,
                         f"import from ./icons, not @phosphor-icons/react directly: {offenders}")

    def test_lamp_icons_use_the_fill_weight(self):
        """Every icon rendered inside a component carries `weight={LAMP_WEIGHT}`.

        An outline glyph cannot read as a lit filament under the glow ladder.
        """
        offenders = {}
        for path in self._components():
            source = path.read_text(encoding="utf-8")
            rendered = re.findall(r"<([A-Z]\w*Icon)\b([^>]*)>", source)
            missing = sorted({name for name, attrs in rendered if "LAMP_WEIGHT" not in attrs})
            if missing:
                offenders[path.stem] = missing
        self.assertEqual({}, offenders, f"icons rendered without weight={{LAMP_WEIGHT}}: {offenders}")


class IconPrecedenceTests(unittest.TestCase):
    """TD resolves first; Phosphor is the fallback.

    2026-08-28, Manoj: *"Maintain separate library for icons that I tell you
    and that takes precedence over phosphoricons. I'll use TD only when there
    is no option available on phosphoricons and if what phosphoricons has is
    bad."*

    Precedence is structural — a role is exported once, from exactly one of the
    two blocks in icons.ts — but nothing in the language enforces which block
    wins, and nothing enforces that a glyph the docs credit to TD actually is
    one. These tests do.
    """

    def _icons(self) -> str:
        return (PACKAGE_SRC / "icons.ts").read_text(encoding="utf-8")

    def _block(self, source_module: str) -> dict:
        """One `export { … } from "<module>";` block, as role -> local name."""
        match = re.search(rf'export \{{([^}}]*)\}} from "{re.escape(source_module)}";', self._icons())
        if not match:
            return {}
        return {role: local for local, role in re.findall(r"^\s*(\w+)\s+as\s+(\w+),", match.group(1), re.M)}

    def test_no_role_is_claimed_by_both_libraries(self):
        """A role drawn by TD must not also be taken from Phosphor.

        Duplicating one is a compile error in the package, but it reaches the
        registry as a silently ambiguous item — the generator would both paste
        the glyph in and import the Phosphor one over it.
        """
        both = sorted(set(self._block("./td-icons")) & set(self._block("@phosphor-icons/react")))
        self.assertEqual([], both, f"roles exported by both icon libraries: {both}")

    def test_the_td_role_list_matches_the_td_export_block(self):
        """`TD_ICON_ROLES` is what tells the docs which glyphs are ours.

        ES exports are not introspectable at runtime, so the list is written
        out by hand beside the block it describes. This is what stops the two
        drifting — a role moved to Phosphor and left in the list would have the
        docs crediting TD for Phosphor's artwork.
        """
        declared = re.search(r"export const TD_ICON_ROLES = \[([^\]]*)\]", self._icons())
        self.assertIsNotNone(declared, "TD_ICON_ROLES is gone from icons.ts")
        listed = sorted(re.findall(r'"(\w+)"', declared.group(1)))
        self.assertEqual(sorted(self._block("./td-icons")), listed,
                         "TD_ICON_ROLES disagrees with the ./td-icons export block")

    def test_every_td_role_names_a_glyph_the_set_draws(self):
        drawn = set(re.findall(r"^export function (\w+)",
                               (PACKAGE_SRC / "td-icons.tsx").read_text(encoding="utf-8"), re.M))
        missing = sorted(local for local in self._block("./td-icons").values() if local not in drawn)
        self.assertEqual([], missing, f"icons.ts names TD glyphs td-icons.tsx does not draw: {missing}")

    def test_td_glyphs_carry_no_colour_of_their_own(self):
        """*"If svgs have colour make em colour neutral."*

        Downloaded artwork arrives with its fill baked in — `#222222` on the
        cancel mark, `#09244B` on WhatsApp. A glyph that keeps it cannot be
        moved by the lamp ramp and inverts wrongly the moment the theme turns
        over. Comments are stripped first: the two hexes above are named in the
        module's own docs, which is exactly where they should survive.
        """
        code = code_only((PACKAGE_SRC / "td-icons.tsx").read_text(encoding="utf-8"))
        literals = re.findall(r"#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(", code)
        self.assertEqual([], literals, f"TD glyphs with a colour of their own: {literals}")
        self.assertIn('color = "currentColor"', code, "a TD glyph must default to currentColor")

    def test_the_docs_index_previews_every_role(self):
        """The icon page documents the whole set, not a sample.

        The set is the one place the role -> glyph mapping is visible, so a
        role missing from the page is a glyph nobody can find. Roles are read
        from both export blocks, so one added to either shows up here.
        """
        roles = set(self._block("./td-icons")) | set(self._block("@phosphor-icons/react"))
        previewed = set(re.findall(r'\["(\w+Icon)",', DOCS.read_text(encoding="utf-8")))
        self.assertEqual(set(), roles - previewed, f"roles absent from the docs icon index: {sorted(roles - previewed)}")
        self.assertEqual(set(), previewed - roles, f"docs icon index previews roles icons.ts does not export: {sorted(previewed - roles)}")


class BrandLogoTests(unittest.TestCase):
    """The brand-logo family — the colour-preserving sibling of the icon set.

    `td-brands.tsx` is generated from `tooling/brands/` (marks + manifest), so
    these mirror the icon-precedence checks with one deliberate difference:
    brand marks keep their own colour. What must not drift is the mapping
    between the manifest, the drawn marks, and the resolver.
    """

    MANIFEST = ROOT / "tooling/brands/manifest.json"
    MODULE = PACKAGE_SRC / "td-brands.tsx"

    def _manifest(self) -> list[dict]:
        return json.loads(self.MANIFEST.read_text(encoding="utf-8"))["brands"]

    def _module(self) -> str:
        return self.MODULE.read_text(encoding="utf-8")

    def _brand_logos(self) -> dict:
        """The `BRAND_LOGOS` object, as slug -> component name."""
        block = re.search(r"export const BRAND_LOGOS = \{([^}]*)\}", self._module())
        self.assertIsNotNone(block, "BRAND_LOGOS is gone from td-brands.tsx")
        return dict(re.findall(r'"([a-z0-9-]+)":\s*(\w+)', block.group(1)))

    def test_the_map_covers_exactly_the_manifest(self):
        manifest = [b["slug"] for b in self._manifest()]
        self.assertEqual(manifest, list(self._brand_logos()),
                         "BRAND_LOGOS disagrees with tooling/brands/manifest.json")

    def test_brand_slugs_matches_the_map(self):
        listed = re.search(r"export const BRAND_SLUGS = \[([^\]]*)\]", self._module())
        self.assertIsNotNone(listed, "BRAND_SLUGS is gone from td-brands.tsx")
        slugs = re.findall(r'"([a-z0-9-]+)"', listed.group(1))
        self.assertEqual(list(self._brand_logos()), slugs,
                         "BRAND_SLUGS disagrees with BRAND_LOGOS")

    def test_every_slug_names_a_mark_the_module_draws(self):
        drawn = set(re.findall(r"^export function (\w+)\(props: BrandLogoProps\)",
                               self._module(), re.M))
        missing = sorted(name for name in self._brand_logos().values() if name not in drawn)
        self.assertEqual([], missing, f"BRAND_LOGOS names marks td-brands.tsx does not draw: {missing}")

    def test_the_module_is_generated_from_the_manifest(self):
        """`td-brands.tsx` is generated. A hand edit is lost on the next run, so a
        stale tree means someone edited the wrong copy."""
        result = subprocess.run(["node", str(ROOT / "tooling/brands/build.mjs"), "--check"],
                                cwd=ROOT, capture_output=True, text=True)
        self.assertEqual(0, result.returncode, result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()
