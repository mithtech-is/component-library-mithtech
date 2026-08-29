/**
 * The design law, checked mechanically.
 *
 * These are CSS tests, not render tests, because the defects they guard are
 * defects in the stylesheet: an element that reads on three sides instead of
 * four, a state ladder whose rungs snap instead of interpolating, a lamp lit
 * with ink. jsdom does not apply an imported stylesheet, so the rules are read
 * from source and parsed here.
 */

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Alert, FilamentButton, TD_ICON_ROLES, ToastProvider, useToast } from "./index";

const SRC = dirname(fileURLToPath(import.meta.url));
/**
 * The registry is the other half of the library, and until 2026-08-28 nothing
 * checked it: this file globbed the package only, so six copy-to-source
 * stylesheets drifted behind their components in silence — a FilamentButton
 * whose inner plate had no rule at all, a SplitButton that showed every option
 * at once, a Badge still spanning its grid track.
 *
 * Both distributions are scanned, and a file is named by its directory so an
 * offender says which one it is in.
 */
const REGISTRY = join(SRC, "../../../registry/tonaldepth");
const listCss = (dir: string, label: string) =>
  readdirSync(dir).filter(name => name.endsWith(".css")).map(name => ({ dir, label, name }));
const cssSources = [...listCss(SRC, "package"), ...listCss(REGISTRY, "registry")];
const cssFiles = cssSources.filter(f => f.label === "package").map(f => f.name);
const read = (name: string) => readFileSync(join(SRC, name), "utf8");
const withoutComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

interface Rule { file: string; selector: string; body: string }

function rules(): Rule[] {
  const out: Rule[] = [];
  for (const source of cssSources) {
    const css = withoutComments(readFileSync(join(source.dir, source.name), "utf8"));
    for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      out.push({ file: `${source.label}/${source.name}`, selector: match[1].trim().replace(/\s+/g, " "), body: match[2] });
    }
  }
  return out;
}

/** Split a `box-shadow` value on its top-level commas — a nested `color-mix()`
 *  or `rgb(from …)` carries commas of its own. */
function shadowParts(value: string): string[] {
  const parts: string[] = [];
  let depth = 0, current = "";
  for (const character of value) {
    if (character === "(") depth += 1;
    if (character === ")") depth -= 1;
    if (character === "," && depth === 0) { parts.push(current.trim()); current = ""; } else current += character;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function boxShadow(body: string): string | null {
  const match = /box-shadow\s*:\s*([^;]+);/.exec(body);
  if (!match) return null;
  const value = match[1].replace(/\s+/g, " ").trim();
  return value === "none" || value.startsWith("var(") ? null : value;
}

/**
 * The lengths in one shadow slot.
 *
 * `px` is optional deliberately: a zero is legal unit-less, and matching only
 * `px` made every slot written `0 0 0 transparent` parse as *no lengths at
 * all*. That is how six unlit slots on the filament strip passed the
 * `transparent` check below — the rule that exists to catch exactly them.
 */
const lengths = (part: string) =>
  (part.match(/(^|\s)(-?[\d.]+)(px)?(?=\s|$)/g) ?? []).map(parseFloat);

/**
 * A filled button is the one raised surface exempt from the ring rule: its
 * fill is what separates it from the page, and its ladder is deliberately its
 * own — the warm `--td-shadow-*` tokens are tuned against the page ground and
 * wash out on saturated colour. Documented in button.css beside the rule.
 */
const FILLED_BUTTON = /\.td-coloured\b/;

/**
 * A dialog sits on a `#000` 50% scrim, not on the page. `--td-raised`'s bright
 * inner highlight reads as a bloom around the panel there and its pale ring
 * reads as an outline rather than an edge, so the highlight is dropped on
 * purpose. Documented in dialog.css beside the rule.
 */
const ON_A_SCRIM = /-dialog\b/;

/**
 * The base classes a registry stylesheet re-declares are copies of
 * `packages/core`, which this file has never checked — the package inherits
 * them rather than shipping them. The depth law is enforced on what the
 * library actually authors: the modifier namespace, in both distributions.
 */
const AUTHORED = /\.td-(react|registry|mk)-/;

describe("light mode reads on all four sides", () => {
  it("gives every raised surface a shade, a highlight and an edge ring", () => {
    const offenders: string[] = [];
    for (const rule of rules()) {
      const value = boxShadow(rule.body);
      if (!value || FILLED_BUTTON.test(rule.selector) || ON_A_SCRIM.test(rule.selector)) continue;
      if (!AUTHORED.test(rule.selector)) continue;
      const outer = shadowParts(value).filter(part => !/\binset\b/.test(part));
      // Light falls from the top-left, so a raised surface casts down-right.
      const shade = outer.find(part => { const n = lengths(part); return n.length >= 3 && (n[0] > 0 || n[1] > 0) && n[2] > 0; });
      if (!shade) continue;
      const highlight = outer.find(part => { const n = lengths(part); return n.length >= 3 && (n[0] < 0 || n[1] < 0) && n[2] > 0; });
      const ring = outer.find(part => /^0 0 0 1px/.test(part));
      if (!highlight || !ring) {
        offenders.push(`${rule.file} — ${rule.selector} is missing ${[!highlight && "the highlight", !ring && "the edge ring"].filter(Boolean).join(" and ")}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe("a state ladder interpolates", () => {
  /**
   * `.td-x:hover` and `.td-x[data-state="hover"]` are rungs of `.td-x`.
   *
   * Only the interaction states are rungs. `[data-state="done"]` on a timeline
   * dot is a different thing being drawn, not the same thing being reached
   * for, and nothing transitions between them.
   */
  const base = (selector: string) => selector
    .split(",")[0]
    .replace(/:(hover|active|focus-visible|focus-within)\b/g, "")
    .replace(/\[data-state="(hover|active)"\]/g, "")
    .trim();

  it("carries the same shadow slots, in the same order, in every state", () => {
    const ladders = new Map<string, { selector: string; file: string; shape: string }[]>();
    for (const rule of rules()) {
      const value = boxShadow(rule.body);
      if (!value || !AUTHORED.test(rule.selector)) continue;
      const key = `${rule.file} ${base(rule.selector)}`;
      const shape = shadowParts(value).map(part => (/\binset\b/.test(part) ? "inset" : "outer")).join("|");
      const rungs = ladders.get(key) ?? [];
      rungs.push({ selector: rule.selector, file: rule.file, shape });
      ladders.set(key, rungs);
    }
    const offenders: string[] = [];
    for (const [key, rungs] of ladders) {
      if (rungs.length < 2) continue;
      const shapes = new Set(rungs.map(rung => rung.shape));
      if (shapes.size > 1) {
        offenders.push(`${key} — rungs disagree: ${rungs.map(rung => `${rung.selector} [${rung.shape}]`).join("  vs  ")}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("writes an unlit slot as the shadow colour at zero alpha, never `transparent`", () => {
    // `transparent` is rgba(0, 0, 0, 0), so a shadow fading from it passes
    // through a dark, half-opaque midpoint — the flash [[L20]] was written for.
    const offenders: string[] = [];
    for (const rule of rules()) {
      const value = boxShadow(rule.body);
      if (!value) continue;
      for (const part of shadowParts(value)) {
        const n = lengths(part);
        const isZeroSlot = n.length >= 3 && n[0] === 0 && n[1] === 0 && n[2] === 0;
        if (isZeroSlot && /\btransparent\b/.test(part) && !/color-mix/.test(part)) {
          offenders.push(`${rule.file} — ${rule.selector}: "${part}"`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe("FilamentButton is the sideways tab, built from `.td-mega-option`", () => {
  // The design this is a component OF ([[L33]]) has three parts and two of
  // them move independently: the row sinks as it is reached for, the tile
  // rides above the row and sinks with it, and the filament only lights.

  it("renders the tile and the label as siblings of the strip, with no inner plate", () => {
    const { container } = render(<FilamentButton label="ERPNext" icon={<svg />} />);
    const row = container.querySelector(".td-react-filament")!;
    expect(row).not.toBeNull();
    expect(container.querySelector(".td-react-filament-inner")).toBeNull();
    const parts = Array.from(row.children).map(child => child.className);
    expect(parts).toEqual(["td-react-filament-strip", "td-react-filament-icon", "td-react-filament-label"]);
  });

  it("moves the row and the tile on their own ladders", () => {
    const css = withoutComments(read("filament-button.css"));
    // The row takes depth in all three rungs.
    for (const rung of [":hover", ":active", "--on"]) {
      const rule = new RegExp(`\\.td-react-filament${rung.replace("--on", "--on")}\\s*\\{[^}]*box-shadow:[^}]*inset`);
      expect(rule.test(css), `the row has no depth at ${rung}`).toBe(true);
    }
    // The tile starts RAISED — it is its own button sitting on the row.
    const tile = /\.td-react-filament-icon\s*\{([^}]*)\}/.exec(css)!;
    expect(tile).not.toBeNull();
    const rest = boxShadow(tile[1])!;
    const outer = shadowParts(rest).filter(part => !/\binset\b/.test(part));
    expect(outer.some(part => /^1\.5px 1\.5px/.test(part)), "the tile does not ride above the row at rest").toBe(true);
    expect(outer.some(part => /^0 0 0 1px var\(--td-edge\)/.test(part))).toBe(true);
    // ...and inverts to pressed once the row is reached for.
    for (const rung of [":hover", ":active"]) {
      const pressed = new RegExp(`\\.td-react-filament${rung} \\.td-react-filament-icon\\s*\\{[^}]*inset [\\d.]+px`);
      expect(pressed.test(css), `the tile does not sink at ${rung}`).toBe(true);
    }
  });

  it("lights the glyph by colour alone — the tile never glows", () => {
    // "The housing never glows and the glyph carries no shadow: the glyph IS
    // the lamp — it lights by colour alone."
    const css = withoutComments(read("filament-button.css"));
    const tileRules = [...css.matchAll(/([^{}]*filament-icon[^{}]*)\{([^{}]*)\}/g)];
    expect(tileRules.length).toBeGreaterThan(3);
    for (const rule of tileRules) {
      expect(rule[2], `${rule[1].trim()} puts a glow on the tile`).not.toMatch(/drop-shadow/);
    }
    // Four rungs of colour: unlit, warming, white-hot, full tone.
    expect(css).toMatch(/\.td-react-filament-icon\s*\{[^}]*color:\s*color-mix\(in srgb, var\(--td-ink-3\)/);
    expect(css).toMatch(/:hover \.td-react-filament-icon\s*\{[^}]*color:\s*color-mix\(in srgb, var\(--td-filament-ink\)/);
    expect(css).toMatch(/:active \.td-react-filament-icon\s*\{[^}]*color:\s*color-mix\(in srgb, #fff/);
    expect(css).toMatch(/--on \.td-react-filament-icon\s*\{[^}]*color:\s*var\(--td-filament-ink\)/);
  });
});

describe("row depth actually paints", () => {
  it("never puts a row shadow on a table that collapses its borders", () => {
    // Under `border-collapse: collapse` a `<tr>` generates no box for a
    // `box-shadow` to paint into, so the rule is discarded in silence. The
    // base layer's table ladder was written correctly and rendered nothing:
    // the background changed and the depth did not, which is why an
    // interactive row read as a flat tint rather than a surface pressed in.
    const offenders: string[] = [];
    for (const source of cssSources) {
      const css = withoutComments(readFileSync(join(source.dir, source.name), "utf8"));
      const file = `${source.label}/${source.name}`;
      // Which table classes this file puts into the collapsing model.
      const collapsed = new Set<string>();
      for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        if (!/border-collapse\s*:\s*collapse/.test(rule[2])) continue;
        for (const cls of rule[1].matchAll(/\.(td-[A-Za-z0-9_-]+)/g)) collapsed.add(cls[1]);
      }
      if (!collapsed.size) continue;
      for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const selector = rule[1].trim().replace(/\s+/g, " ");
        // A shadow on the ROW itself — a shadow on a cell paints fine.
        if (!/\btr\b\s*(:[a-z-]+|\[[^\]]*\])*\s*$/.test(selector)) continue;
        const value = boxShadow(rule[2]);
        if (!value) continue;
        if ([...collapsed].some(c => selector.includes(`.${c}`)))
          offenders.push(`${file} — ${selector}: a row shadow under border-collapse: collapse never paints`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe("a lamp is lit with a named light", () => {
  it("never glows in `currentColor`", () => {
    // At rest a glyph's colour is ink — near-black on paper — so a drop-shadow
    // that inherits it paints a dark smear rather than light ([[L20]]).
    const offenders: string[] = [];
    for (const source of cssSources) {
      const file = `${source.label}/${source.name}`;
      const css = withoutComments(readFileSync(join(source.dir, source.name), "utf8"));
      for (const match of css.matchAll(/(drop-shadow|box-shadow)\s*:?\s*\(?[^;{}]*currentColor[^;{}]*/gi)) {
        offenders.push(`${file}: ${match[0].trim().slice(0, 90)}`);
      }
      if (/--td-lamp-glow\s*:\s*currentColor/.test(css)) offenders.push(`${file}: --td-lamp-glow: currentColor`);
    }
    expect(offenders).toEqual([]);
  });
});

describe("Alert", () => {
  it("renders a lamp rather than a bullet character", () => {
    const { container } = render(<Alert variant="success" title="Verified">Green.</Alert>);
    expect(container.querySelector(".td-react-alert-lamp")).not.toBeNull();
    expect(container.textContent).not.toContain("●");
    expect(container.querySelector(".td-alert-icon")).toBeNull();
  });

  it("names its variant so the lamp can be lit by it", () => {
    const { container } = render(<Alert variant="error" title="Blocked" />);
    expect(container.querySelector(".td-react-alert--error")).not.toBeNull();
  });

  it("carries no category wash and no painted rail", () => {
    const css = withoutComments(read("alert.css"));
    // Colour is category, but a tinted band is not how the system says it —
    // the lamp is. A wash would show up as a variant rule setting `background`.
    expect(css).not.toMatch(/\.td-alert--(info|success|warning|error)[^{]*\{[^}]*background:/);
    expect(css).toMatch(/border-left:\s*0/);
    // The socket is the page's own material, not a tinted tile.
    expect(css).toMatch(/\.td-react-alert-lamp\s*\{[^}]*background:\s*var\(--td-surface\)/);
    for (const [variant, token] of [["info", "accent"], ["success", "green"], ["warning", "warning"], ["error", "error"]]) {
      expect(css).toContain(`.td-react-alert--${variant} .td-react-alert-lamp { --td-lamp-glow: var(--td-${token}); }`);
    }
  });

  it("gives the dismiss control a rest state, so it reads as a control", () => {
    const css = withoutComments(read("alert.css"));
    const rest = /\.td-alert-close\.td-react-alert-close\s*\{([^}]*)\}/.exec(css);
    expect(rest).not.toBeNull();
    expect(boxShadow(rest![1])).not.toBeNull();
    expect(css).toMatch(/\.td-alert-close\.td-react-alert-close:focus-visible/);
  });
});

describe("Toast", () => {
  function Trigger() {
    const { toast } = useToast();
    return <button type="button" onClick={() => toast({ title: "Saved", variant: "success", duration: 0 })}>go</button>;
  }

  it("renders a lamp and a dismiss control", async () => {
    const { container } = render(<ToastProvider><Trigger /></ToastProvider>);
    screen.getByRole("button", { name: "go" }).click();
    const toast = await screen.findByRole("status");
    expect(toast).toHaveClass("td-react-toast", "td-react-toast--success");
    expect(container.querySelector(".td-react-toast-lamp")).not.toBeNull();
    expect(container.querySelector(".td-react-toast-close")).not.toBeNull();
    expect(container.querySelector(".td-toast-dot")).toBeNull();
  });

  it("is carved rather than floated", () => {
    const css = withoutComments(read("toast.css"));
    const rule = /\.td-toast\.td-react-toast\s*\{([^}]*)\}/.exec(css);
    expect(rule).not.toBeNull();
    const value = boxShadow(rule![1]);
    expect(value).not.toBeNull();
    // `var(--td-raised)` is a 12px drop shadow whose highlight is bigger and
    // stronger than its shade — the panel floats and wears a white halo.
    expect(rule![1]).not.toContain("--td-raised");
    const outer = shadowParts(value!).filter(part => !/\binset\b/.test(part));
    const shade = lengths(outer[0]);
    const highlight = lengths(outer[1]);
    // One light source: the shade and the highlight are mirror images.
    expect([shade[0], shade[1]]).toEqual([-highlight[0], -highlight[1]]);
    expect(shade[0]).toBeLessThanOrEqual(3);
    expect(outer.some(part => /^0 0 0 1px var\(--td-edge\)/.test(part))).toBe(true);
  });

  it("marks the dismiss control with a bare cross, not a filled disc", async () => {
    // CloseIcon was Phosphor's XCircle: a solid disc, which at the 13px a
    // dismiss control uses reads as a hole punched in the toast rather than a
    // mark on it — and it was the same glyph as CancelIcon, so dismissing and
    // refusing looked identical.
    render(<ToastProvider><Trigger /></ToastProvider>);
    screen.getByRole("button", { name: "go" }).click();
    const toast = await screen.findByRole("status");
    const glyph = toast.querySelector(".td-react-toast-close svg")!;
    expect(glyph).not.toBeNull();
    // A disc is one arc-heavy path; the cross is a straight-edged polygon.
    const path = glyph.querySelector("path")!.getAttribute("d")!;
    expect(path).not.toMatch(/[Aa]\s*[\d.]+[,\s]/);
    expect(glyph.getAttribute("fill")).toBe("currentColor");
    expect(TD_ICON_ROLES).toContain("CloseIcon");
  });

  it("keeps the dismiss control on the title's row on a phone", () => {
    // The base drops `.td-toast` and `.td-alert` to two columns below 640px,
    // which pushed the dismiss control onto a row of its own under the lamp.
    for (const file of ["toast.css", "alert.css"]) {
      const css = withoutComments(read(file));
      const query = /@media \(max-width: 640px\) \{([\s\S]*?)\n\}/.exec(css);
      expect(query, `${file} has no narrow-screen rule`).not.toBeNull();
      expect(query![1]).toMatch(/grid-template-columns:\s*20px minmax\(0, 1fr\) auto/);
    }
  });
});

describe("IconButton", () => {
  it("draws a labelled lamp at the system's large control height", () => {
    const css = withoutComments(read("icon-button.css"));
    const rule = /\.td-react-iconbutton\.td-glowicon\.td-glowicon--text\s*\{([^}]*)\}/.exec(css);
    expect(rule, "the labelled pill has no sizing rule").not.toBeNull();
    expect(rule![1]).toMatch(/min-height:\s*var\(--td-btn-h-lg, 50px\)/);
    expect(rule![1]).toMatch(/font-size:\s*14px/);
    // Next to a 600-weight label an 18px filled glyph is the lightest thing in
    // the button, so the lamp grows with the housing: 21px against this rule's
    // own 14px label. Written as the ratio rather than the literal, because
    // Button, SplitButton and FilamentButton now share it.
    expect(css).toMatch(/\.td-glowicon--text \.td-react-iconbutton-lamp > svg\s*\{[^}]*width:\s*1\.5em/);
  });

  it("scales every BARE icon+label lamp to the same ratio the labelled pill set", () => {
    // [[L28]] fixed the ratio at 1.5x on IconButton and nothing carried it to
    // the others: Button's lamp was `1em` — 13px beside a 13px label — and
    // SplitButton sat at 1.16x. A lamp smaller than this reads as the lightest
    // thing in a control whose whole state signal it carries.
    //
    // "Bare" is load-bearing: the rule sizes a glyph that sits directly beside
    // a label with no housing, where the glyph is the only optical mass on
    // that side. FilamentButton is deliberately absent — its glyph is housed
    // in a tile, and is checked against the tile below instead.
    const lamps: [string, RegExp][] = [
      ["button.css", /\.td-react-button-lamp > svg\s*\{[^}]*width:\s*1\.5em/],
      ["split-button.css", /\.td-react-split-icon > svg\s*\{[^}]*width:\s*1\.5em/],
    ];
    const offenders = lamps
      .filter(([file, pattern]) => !pattern.test(withoutComments(read(file))))
      .map(([file]) => file);
    expect(offenders).toEqual([]);
  });

  it("sizes a HOUSED glyph against its housing, not against the label", () => {
    // FilamentButton's tile is its own button inside the row ([[L33]]), so the
    // TILE carries the optical mass and takes the ratio against the label. The
    // glyph is sized against the tile: filling it leaves no housing around the
    // mark, the tile stops reading as a tile, and the glyph reads oversized —
    // which is exactly what was reported.
    const css = withoutComments(read("filament-button.css"));
    const tile = /\.td-react-filament-icon\s*\{([^}]*)\}/.exec(css);
    expect(tile, "the tile has no sizing rule").not.toBeNull();
    const tileEm = parseFloat(/width:\s*([\d.]+)em/.exec(tile![1])![1]);
    const glyphEm = parseFloat(/\.td-react-filament-icon > svg\s*\{[^}]*width:\s*([\d.]+)em/.exec(css)![1]);
    // The tile still outweighs the label the way a bare lamp would...
    expect(tileEm).toBeGreaterThanOrEqual(1.5);
    // ...and the glyph sits inside it with real housing left around it.
    expect(glyphEm).toBeLessThan(tileEm * 0.7);
    expect(glyphEm).toBeGreaterThan(tileEm * 0.5);
  });
});
