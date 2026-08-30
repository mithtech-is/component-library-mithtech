/**
 * The frame law and the filament ladder, checked against the design system.
 *
 * Both were built from the wrong source once: the frame's radii from loose
 * `--td-radius-*` steps instead of the subtraction that makes a well read as
 * cut rather than stuck on, and the filament's four states from `.td-lamp`,
 * the 7px dot, instead of `.td-mega-option`, the sideways tab. These are CSS
 * tests for the same reason `depth.test.tsx` is: the defects live in the
 * stylesheet, and jsdom does not apply an imported one.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChartContainer, Frame, FrameGrid } from "./index";

const SRC = dirname(fileURLToPath(import.meta.url));
const REGISTRY = join(SRC, "../../../registry/tonaldepth");
const withoutComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

/** Both distributions, so a registry copy cannot drift behind its component. */
const copies = (name: string) => [
  { label: `package/${name}`, css: withoutComments(readFileSync(join(SRC, name), "utf8")) },
  { label: `registry/${name}`, css: withoutComments(readFileSync(join(REGISTRY, name), "utf8")) },
];

/** The body of the first rule whose selector matches. */
function rule(css: string, test: RegExp): string {
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (test.test(match[1].trim().replace(/\s+/g, " "))) return match[2];
  }
  return "";
}
/** Split a `box-shadow` on its top-level commas — `color-mix()` and a `var()`
 *  fallback both carry commas of their own. */
function slots(value: string): string[] {
  const out: string[] = [];
  let depth = 0, current = "";
  for (const character of value) {
    if (character === "(") depth += 1;
    if (character === ")") depth -= 1;
    if (character === "," && depth === 0) { out.push(current.trim()); current = ""; } else current += character;
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

const decl = (body: string, property: string) =>
  new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*([^;]+)`).exec(body)?.[1].replace(/\s+/g, " ").trim() ?? "";

describe("the frame's well is cut, not stuck on", () => {
  it("takes its plate padding and radius from the frame tokens", () => {
    for (const { label, css } of copies("frame.css")) {
      const plate = rule(css, /^\.td-(react|registry)-frame$/);
      expect(decl(plate, "padding"), label).toMatch(/--td-frame-pad/);
      expect(decl(plate, "border-radius"), label).toMatch(/--td-frame-radius/);
    }
  });

  /**
   * The rule the design law states as an equation: well radius = bezel radius
   * − padding, which `--td-well-radius` computes. Any loose `--td-radius-*`
   * step here is a number that happens to look close and is not concentric —
   * the frame shipped at 16px plate / 22px padding / 14px well, and 16 − 22 is
   * not 14. Equal or arbitrary radii read as a sticker on a card.
   */
  it("computes the well radius by subtraction rather than picking a step", () => {
    for (const { label, css } of copies("frame.css")) {
      const well = rule(css, /^\.td-(react|registry)-frame-well$/);
      expect(decl(well, "border-radius"), label).toMatch(/--td-well-radius/);
      expect(decl(well, "border-radius"), label).not.toMatch(/--td-radius-\d/);
    }
  });

  /**
   * "Same material, opposite directions." A well is the surface pressed in,
   * so it is separated by shadow alone — darkening its fill is a colour band
   * doing the work depth is supposed to do.
   */
  it("fills the well with the plain surface and separates it by shadow", () => {
    for (const { label, css } of copies("frame.css")) {
      const well = rule(css, /^\.td-(react|registry)-frame-well$/);
      expect(decl(well, "background"), label).toBe("var(--td-surface)");
      expect(decl(well, "box-shadow"), label).toMatch(/--td-inset-soft/);
      for (const [selector, body] of [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => [m[1].trim(), m[2]] as const)) {
        if (!/-frame-well\b/.test(selector)) continue;
        expect(`${label} ${selector}: ${decl(body, "background")}`).not.toMatch(/black/);
      }
    }
  });

  /**
   * Reported as *"the well isn't distinctive enough — make it so sitewide"*,
   * and both halves of the fix are the kind that get undone by the next
   * person answering the same symptom locally.
   *
   * The well used to carry a light-mode-only `0 0 0 1px var(--td-edge)` ring,
   * on the reasoning that light carves shallower and needs all four sides.
   * That ring was in the stylesheet the entire time the well was being
   * reported as flat, so it was never what made the well read — it is an
   * outline doing depth's job, and a well is separated by shadow alone
   * ([[L32]]). The carve now lives in `--td-inset-soft`, per theme ([[L40]]).
   *
   * And `deep` must be the shared token rather than its own numbers. It was a
   * hand-rolled mix, which was fine until `soft` was retuned past it — at
   * which point the deeper well was the shallower one, with nothing in either
   * rule looking wrong.
   */
  it("carves the well with the shared tokens rather than a local ring or local numbers", () => {
    for (const { label, css } of copies("frame.css")) {
      for (const [selector, body] of [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => [m[1].trim().replace(/\s+/g, " "), m[2]] as const)) {
        if (!/-frame-well\b/.test(selector)) continue;
        const shadow = decl(body, "box-shadow");
        if (!shadow || shadow === "none") continue;
        // A non-inset slot on a well is a ring drawn around a recess.
        for (const slot of slots(shadow)) {
          expect(slot, `${label} ${selector}`).toMatch(/^(inset|var\()/);
        }
      }
      const deep = rule(css, /-frame--deep .td-(react|registry)-frame-well$/);
      expect(decl(deep, "box-shadow"), label).toBe("var(--td-inset-deep)");
    }
  });
});

describe("the filament runs the sideways tab's ladder, not the dot lamp's", () => {
  /**
   * `.td-mega-option:active::before` goes `color-mix(#fff 65%, brand)` with a
   * white core in the glow. The filament was built from `.td-lamp`, which has
   * no white step — so its press was the held colour with a wider halo, and a
   * wider halo reads as a bigger held state rather than as a click.
   */
  it("goes white-hot at the press", () => {
    for (const { label, css } of copies("filament-button.css")) {
      const press = rule(css, /:active .td-(react|registry)-filament-strip$/);
      expect(decl(press, "background"), label).toMatch(/#fff|--td-filament-press-white/);
      expect(decl(press, "box-shadow"), label).toMatch(/#fff/);
    }
  });

  it("lights the strip to full colour on hover rather than a mix toward the surface", () => {
    for (const { label, css } of copies("filament-button.css")) {
      const hover = rule(css, /:hover .td-(react|registry)-filament-strip$/);
      expect(decl(hover, "background"), label).toBe("var(--td-filament-ink)");
    }
  });

  /** A dead filament is grey glass — it carries no hue at all. */
  it("keeps the tone out of the unlit strip", () => {
    for (const { label, css } of copies("filament-button.css")) {
      const rest = rule(css, /^\.td-(react|registry)-filament-strip$/);
      expect(decl(rest, "background"), label).toMatch(/--td-ink-3/);
      expect(decl(rest, "background"), label).not.toMatch(/--td-filament-ink/);
    }
  });
});

describe("Frame", () => {
  it("renders the element it is asked for, so a figure stays a figure", () => {
    const { container } = render(<Frame as="figure" title="Days to collect">plot</Frame>);
    expect(container.querySelector("figure")).not.toBeNull();
    expect(container.querySelector("section")).toBeNull();
  });

  it("names itself by its title for a screen reader", () => {
    render(<Frame title="Days to collect">plot</Frame>);
    expect(screen.getByRole("region", { name: "Days to collect" })).toBeTruthy();
  });

  it("puts every child in the well", () => {
    const { container } = render(<Frame title="t"><span data-testid="plot" /></Frame>);
    expect(container.querySelector(".td-react-frame-well [data-testid='plot']")).not.toBeNull();
  });

  it("heads at h3 by default and at the level the caller names", () => {
    // A frame taken as a section's only heading emitted an h3 under an h1's
    // page of h2s, so the outline had a level missing from it. Nothing warned
    // — the workaround was to drop the title slot and compose the header
    // outside the frame, which makes eyebrow/title/description unusable for
    // any frame that is a section rather than a figure.
    const { rerender } = render(<Frame title="9 plants · 1 operating system">plot</Frame>);
    expect(screen.getByText("9 plants · 1 operating system").tagName).toBe("H3");

    for (const level of ["h2", "h3", "h4"] as const) {
      rerender(<Frame titleAs={level} title="9 plants">plot</Frame>);
      const heading = screen.getByRole("heading", { name: "9 plants" });
      expect(heading.tagName).toBe(level.toUpperCase());
      // The tag is the only thing that moves: the class, the id wiring and the
      // region's accessible name all hold.
      expect(heading).toHaveClass("td-react-frame-title");
      expect(screen.getByRole("region", { name: "9 plants" })).toBeTruthy();
    }

    // `p` is the opt-out: a caption belongs in no outline at all.
    rerender(<Frame titleAs="p" title="9 plants">plot</Frame>);
    expect(screen.queryByRole("heading")).toBeNull();
    expect(screen.getByText("9 plants").tagName).toBe("P");
  });

  it("sizes the title separately from the level it heads at", () => {
    // The two are deliberately independent: a section heading that has to stay
    // quiet and a figure caption that has to be loud are both real, so neither
    // prop overrides the other.
    const { rerender } = render(<Frame title="Days to collect">plot</Frame>);
    expect(screen.getByText("Days to collect")).toHaveClass("td-react-frame-title--caption");

    rerender(<Frame titleAs="h2" titleScale="section" title="Days to collect">plot</Frame>);
    const heading = screen.getByRole("heading", { name: "Days to collect" });
    expect(heading.tagName).toBe("H2");
    expect(heading).toHaveClass("td-react-frame-title--section");

    // And the other way round, which is the half that proves they are separate.
    rerender(<Frame titleAs="h4" titleScale="section" title="Days to collect">plot</Frame>);
    expect(screen.getByRole("heading", { name: "Days to collect" })).toHaveClass("td-react-frame-title--section");
    rerender(<Frame titleAs="h2" title="Days to collect">plot</Frame>);
    expect(screen.getByRole("heading", { name: "Days to collect" })).toHaveClass("td-react-frame-title--caption");
  });

  it("draws the section scale bigger than the caption, in both distributions", () => {
    for (const { label, css } of copies("frame.css")) {
      const P = label.startsWith("registry") ? "registry" : "react";
      const caption = decl(rule(css, new RegExp(`^\\.td-${P}-frame-title$`)), "font-size");
      const section = decl(rule(css, new RegExp(`^\\.td-${P}-frame-title--section$`)), "font-size");
      expect(caption, label).toBe("1rem");
      // The system's own h4 step rather than a number invented for the frame.
      expect(section, label).toBe("clamp(20px, 2.2vw, 28px)");
    }
  });

  it("carries the grid's minimum through as a custom property", () => {
    const { container } = render(<FrameGrid min={260} />);
    expect((container.firstElementChild as HTMLElement).style.getPropertyValue("--td-frame-min")).toBe("260px");
  });
});

describe("ChartContainer", () => {
  /** Manoj's rule: a measured object is housed in the frame, not on a plate. */
  it("houses the plot in a frame's well", () => {
    const { container } = render(
      <ChartContainer title="Weekly signups"><svg data-testid="plot" /></ChartContainer>,
    );
    expect(container.querySelector("figure.td-react-frame")).not.toBeNull();
    expect(container.querySelector(".td-react-frame-well [data-testid='plot']")).not.toBeNull();
  });

  it("runs the well flush, because a plot carries its own margins", () => {
    const { container } = render(<ChartContainer title="t"><svg /></ChartContainer>);
    expect(container.querySelector(".td-react-frame-well--flush")).not.toBeNull();
  });

  it("keeps the text alternative wired to the figure", () => {
    const { container } = render(
      <ChartContainer title="Weekly signups" description="Signups rose through Q3."><svg /></ChartContainer>,
    );
    const figure = container.querySelector("figure") as HTMLElement;
    const describedBy = figure.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(container.querySelector(`#${CSS.escape(describedBy as string)}`)?.textContent).toBe("Signups rose through Q3.");
  });

  it("puts the legend under the well", () => {
    const { container } = render(
      <ChartContainer title="t" legend={[{ label: "This week" }, { label: "Last week" }]}><svg /></ChartContainer>,
    );
    expect(container.querySelector(".td-react-frame-footnote .td-chart-legend")).not.toBeNull();
    expect(container.querySelectorAll(".td-chart-legend-item")).toHaveLength(2);
  });
});
