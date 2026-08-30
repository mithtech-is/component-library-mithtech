from __future__ import annotations

import hashlib
import json
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
NPM = shutil.which("npm.cmd") or shutil.which("npm") or "npm"
sys.path.insert(0, str(ROOT / "tooling" / "tokens"))
import build  # noqa: E402


class CoreFoundationTests(unittest.TestCase):
    def setUp(self):
        self.source = json.loads((ROOT / "others/tokens/source/tokens.json").read_text(encoding="utf-8"))
        self.tokens = build.validate(self.source)

    def test_canonical_schema_and_legacy_variables(self):
        self.assertEqual(141, len(self.tokens))
        variables = {item["$extensions"]["tonaldepth"]["cssVariable"] for item in self.tokens}
        self.assertIn("--td-bg", variables)
        self.assertIn("--td-font-ui", variables)
        self.assertIn("--td-density", variables)
        # The lamp's colour ladder. Only the STRENGTHS are tokens: a rung
        # written as `var(--td-lamp-glow)` at `:root` resolves there, so it
        # bakes in the root's green and every housing inherits it whatever
        # light it names. The mix has to happen where the glow is in scope.
        for name in ("--td-lamp-unlit", "--td-lamp-hover-mix", "--td-lamp-held-mix"):
            self.assertIn(name, variables)
        self.assertNotIn("--td-lamp-ink-press", variables)
        # The row ladder is a token too, and it has to be: every component with
        # rows reads its press from these, and the dark values are not a
        # percentage of the light ones — `--td-shadow-light` is 6% in dark, so
        # a mix of it is nothing and the carved edge disappears.
        for name in ("--td-row-rest", "--td-row-hover", "--td-row-press", "--td-row-selected"):
            self.assertIn(name, variables)
        rows = {item["$extensions"]["tonaldepth"]["cssVariable"]: item
                for item in self.tokens if item["$extensions"]["tonaldepth"]["cssVariable"].startswith("--td-row-")}
        for name, item in rows.items():
            self.assertIn("dark", item["$extensions"]["tonaldepth"]["modes"], f"{name} has no dark value")
            # Same slot count in every rung, or the ladder snaps instead of
            # interpolating ([[L18]]).
            self.assertEqual(2, item["$value"].count("inset"), f"{name} is not a two-slot ladder rung")
            self.assertEqual(2, item["$extensions"]["tonaldepth"]["modes"]["dark"].count("inset"), f"{name} dark is not two slots")

        # The glow ladder is a token like any other, so it can be retuned
        # without touching a component.
        for knob in ("--td-glow-hover-blur", "--td-glow-hover-strength",
                     "--td-glow-active-blur", "--td-glow-active-strength"):
            self.assertIn(knob, variables)

    def test_the_well_carves_in_both_themes_and_deep_is_deeper(self):
        """The well reads on paper, and `deep` is deeper than `soft`.

        Reported as *"the frame's well is nearly flat on #F5F5F5"*, and the
        cause was the one [[L40]] records for the row ladder: both inset
        tokens were a single mix over `--td-shadow-*`, whose light value is a
        third of its dark strength and whose dark `--td-shadow-light` is
        `0.062`. Ninety-two percent of 0.062 is an alpha of 0.057 — the carved
        upper edge simply was not drawn, and no percentage of that token can
        draw it.

        So both wells state their own dark values, and both carry the three
        parts a cut edge needs: the lip, the shade falling from it, the bounce
        off the lower wall. Two invariants are checked because the second is
        the one that goes wrong quietly — retuning `soft` and leaving `deep`
        on its old numbers makes the deeper well the shallower one, and
        nothing about the stylesheet looks wrong.
        """
        by_var = {item["$extensions"]["tonaldepth"]["cssVariable"]: item for item in self.tokens}
        strengths = {}
        for name in ("--td-inset-soft", "--td-inset-deep"):
            item = by_var[name]
            modes = item["$extensions"]["tonaldepth"]["modes"]
            self.assertIn("dark", modes, f"{name} has no dark value — a mix over --td-shadow-light draws no lip in dark")
            for mode, value in (("light", item["$value"]), ("dark", modes["dark"])):
                self.assertEqual(3, value.count("inset"), f"{name} {mode} is not lip + shade + bounce")
                self.assertNotIn("color-mix", value, f"{name} {mode} mixes over a token instead of stating its own strength")
                # The lip: a hairline on the cut upper edge, no blur.
                self.assertRegex(value.split(",")[0].strip(), r"^inset 0 [\d.]+px 0 ",
                                 f"{name} {mode} does not open with an unblurred top lip")
                strengths[(name, mode)] = [float(a) for a in re.findall(r"rgba\([^)]*?([\d.]+)\)", value)]

        for mode in ("light", "dark"):
            soft, deep = strengths[("--td-inset-soft", mode)], strengths[("--td-inset-deep", mode)]
            for slot, (a, b) in enumerate(zip(soft, deep)):
                self.assertGreater(b, a, f"--td-inset-deep is not deeper than --td-inset-soft in {mode} at slot {slot}")

    def test_lamp_ladder_is_interpolable_and_never_none(self):
        """The glow ladder has to animate, not snap.

        Two defects came out of getting this wrong, and both are invisible in a
        static render: transitioning from `filter: none` lets the engine invent
        the start value and it flashes a dark shadow behind the icon; and a
        state with a different number of drop-shadow() functions snaps instead
        of interpolating, which made press look identical to hover.
        """
        by_var = {item["$extensions"]["tonaldepth"]["cssVariable"]: item["$value"] for item in self.tokens}
        off, hover, active = by_var["--td-lamp-off"], by_var["--td-lamp-hover"], by_var["--td-lamp-active"]
        for name, value in (("off", off), ("hover", hover), ("active", active)):
            self.assertEqual(2, value.count("drop-shadow("), f"--td-lamp-{name} must carry exactly two shadows")
            self.assertNotIn("none", value, f"--td-lamp-{name} must not be `none`")
        # Rest is genuinely dark, and press outruns hover on both blur and strength.
        self.assertNotIn("color-mix", off)
        self.assertIn("--td-glow-active-halo-blur", active)
        self.assertNotIn("--td-glow-active-halo-blur", hover)

    def test_press_outshines_hover(self):
        """`--td-glow-active-*` must exceed `--td-glow-hover-*`, or the ladder is
        flat and a press is indistinguishable from a hover."""
        by_var = {item["$extensions"]["tonaldepth"]["cssVariable"]: item["$value"] for item in self.tokens}
        px = lambda v: float(v.removesuffix("px"))
        pct = lambda v: float(v.removesuffix("%"))
        self.assertGreater(px(by_var["--td-glow-active-blur"]), px(by_var["--td-glow-hover-blur"]))
        self.assertGreater(pct(by_var["--td-glow-active-strength"]), pct(by_var["--td-glow-hover-strength"]))

    def test_required_modes(self):
        by_var = {item["$extensions"]["tonaldepth"]["cssVariable"]: item for item in self.tokens}
        self.assertEqual("#1A1815", by_var["--td-bg"]["$extensions"]["tonaldepth"]["modes"]["dark"])
        density = by_var["--td-density"]["$extensions"]["tonaldepth"]["modes"]
        self.assertEqual({"compact": "0.75", "comfortable": "1", "spacious": "1.35"}, density)

    def test_generation_is_deterministic(self):
        build.main()
        dist = ROOT / "components/packages/core/dist"
        first = {path.name: hashlib.sha256(path.read_bytes()).hexdigest() for path in dist.iterdir() if path.is_file()}
        build.main()
        second = {path.name: hashlib.sha256(path.read_bytes()).hexdigest() for path in dist.iterdir() if path.is_file()}
        self.assertEqual(first, second)

    def test_build_check_matches_dist(self):
        # `pnpm tokens:build` is wired into `pnpm generate`, but a hand edit to
        # others/tokens/source/tokens.json without running the generator would leave
        # dist stale. --check makes that a hard failure instead of a silent
        # drift, matching the two registry generators that already do this.
        build.main()
        self.assertEqual(0, build.main(check=True))

    def test_font_faces_try_two_cdns_before_self_hosting(self):
        """Font loading is CDN-first with a self-hosted last resort.

        The failover is the `src:` list itself — a browser walks it in order —
        so every face must name both CDNs before the local path. Two @import-ed
        stylesheets would not fail over: both get fetched and the later one
        shadows the earlier.
        """
        css = (ROOT / "components/packages/core/dist/fonts.css").read_text(encoding="utf-8")
        blocks = [block for block in css.split("@font-face")[1:]]
        self.assertTrue(blocks, "fonts.css declares no faces")
        for block in blocks:
            sources = re.findall(r'url\("([^"]+)"\)', block)
            self.assertEqual(3, len(sources), f"expected two CDNs then a local path: {sources}")
            self.assertTrue(sources[0].startswith("https://cdn.jsdelivr.net/"), sources[0])
            self.assertTrue(sources[1].startswith("https://unpkg.com/"), sources[1])
            self.assertTrue(sources[2].startswith("/fonts/"), sources[2])
            self.assertIn("font-display: swap", block)

    def test_font_faces_cover_every_family_token(self):
        """Every `--td-font-*` family the tokens name must actually be fetched.

        The two files drift independently: tokens.json says what a component
        asks for, fonts.json says what arrives. A family renamed in one and not
        the other falls back to a system face with no error anywhere.
        """
        fonts = json.loads((ROOT / "others/tokens/source/fonts.json").read_text(encoding="utf-8"))
        loaded = {family["family"] for family in fonts["families"]}
        by_var = {item["$extensions"]["tonaldepth"]["cssVariable"]: item for item in self.tokens}
        for variable in ("--td-font-display", "--td-font-sans", "--td-font-ui", "--td-font-mono"):
            first = by_var[variable]["$value"].split(",")[0].strip().strip('"')
            self.assertIn(first, loaded, f"{variable} names {first!r}, which fonts.json never loads")

    def test_no_fonts_entrypoint_makes_no_font_request(self):
        """The offline/self-hosted path stays available and genuinely quiet.

        index.css pulls the CDN layer by design; index-no-fonts.css is the
        documented opt-out and must reach neither a CDN nor an @font-face.
        """
        dist = ROOT / "components/packages/core/dist"
        entry = (dist / "index-no-fonts.css").read_text(encoding="utf-8")
        self.assertNotIn("fonts.css", entry)
        reached = "\n".join((dist / name).read_text(encoding="utf-8") for name in ("compat.css", "tokens.css"))
        for host in ("fonts.googleapis.com", "fonts.gstatic.com", "cdn.jsdelivr.net", "unpkg.com"):
            self.assertNotIn(host, reached)
        self.assertNotIn("@font-face", reached)

    def test_compatibility_css_contains_existing_classes(self):
        css = (ROOT / "components/packages/core/dist/compat.css").read_text(encoding="utf-8")
        for selector in (".td-root", ".td-primary", ".td-cta", ".td-panel", ".td-table"):
            self.assertIn(selector, css)

    def test_dashboard_fixture_consumes_package_css(self):
        fixture = (ROOT / "static/examples/html-dashboard/index.html").read_text(encoding="utf-8")
        self.assertIn('../../../components/packages/core/dist/index.css', fixture)
        self.assertIn('class="td-root"', fixture)
        self.assertIn('class="td-kpi-grid"', fixture)
        self.assertNotIn("<style", fixture.lower())
        self.assertNotIn("<script", fixture.lower())

    def test_packed_consumer_install(self):
        package = ROOT / "components/packages/core"
        with tempfile.TemporaryDirectory(prefix="tonaldepth-core-") as folder:
            temp = Path(folder)
            packed = subprocess.run(
                [NPM, "pack", str(package), "--json", "--pack-destination", str(temp)],
                cwd=ROOT, check=True, capture_output=True, text=True,
            )
            filename = json.loads(packed.stdout)[0]["filename"]
            consumer = temp / "consumer"
            consumer.mkdir()
            (consumer / "package.json").write_text('{"name":"consumer","private":true}\n', encoding="utf-8")
            subprocess.run(
                [NPM, "install", "--ignore-scripts", "--no-audit", "--no-fund", str(temp / filename)],
                cwd=consumer, check=True, capture_output=True, text=True,
            )
            installed = consumer / "node_modules/@mithtech-bengaluru/tonaldepth-core"
            files = {str(path.relative_to(installed)).replace("\\", "/") for path in installed.rglob("*") if path.is_file()}
            self.assertEqual(
                {"README.md", "package.json", "dist/compat.css", "dist/fonts.css", "dist/index.css",
                 "dist/index-no-fonts.css", "dist/tokens.css", "dist/tokens.json"},
                files,
            )


if __name__ == "__main__":
    unittest.main()
