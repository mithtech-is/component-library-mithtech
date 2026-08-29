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
