/**
 * UptimeBars — a status-page uptime strip.
 *
 * What is tested is the contract: each row shows its name and figure as readable
 * text while the bars are hidden from assistive tech; a bar carries its state as
 * a data attribute (and an "up" bar carries none, the default); a bar accepts a
 * bare state or a { state, label } with hover detail; and the strip draws one bar
 * per entry.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import axe from "axe-core";
import { UptimeBars, type UptimeRow } from "./index";

const ROWS: UptimeRow[] = [
  { name: "commercely", pct: "100%", bars: ["up", "up", "up"] },
  {
    name: "signly",
    pct: "99.92%",
    bars: ["up", { state: "warn", label: "Mar 8 · degraded 4m" }, { state: "down", label: "Mar 9 · down 12m" }],
  },
];

describe("UptimeBars", () => {
  it("shows each service name and figure as readable text", () => {
    render(<UptimeBars rows={ROWS} />);
    expect(screen.getByText("commercely")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("signly")).toBeInTheDocument();
    expect(screen.getByText("99.92%")).toBeInTheDocument();
  });

  it("carries state as a data attribute, and none for the up default", () => {
    const { container } = render(<UptimeBars rows={ROWS} />);
    const bars = container.querySelectorAll<HTMLElement>(".td-uptime-bar");
    // Two rows of three bars each.
    expect(bars).toHaveLength(6);
    // Row 1 is all up: no data-state.
    expect(bars[0].hasAttribute("data-state")).toBe(false);
    // Row 2: up, warn, down.
    expect(bars[3].hasAttribute("data-state")).toBe(false);
    expect(bars[4]).toHaveAttribute("data-state", "warn");
    expect(bars[5]).toHaveAttribute("data-state", "down");
  });

  it("puts a bar's label in a hover title", () => {
    const { container } = render(<UptimeBars rows={ROWS} />);
    const bars = container.querySelectorAll<HTMLElement>(".td-uptime-bar");
    expect(bars[4]).toHaveAttribute("title", "Mar 8 · degraded 4m");
  });

  it("hides the bar strip from assistive tech", () => {
    const { container } = render(<UptimeBars rows={ROWS} />);
    expect(container.querySelector(".td-uptime-bars")).toHaveAttribute("aria-hidden", "true");
  });

  it("has no critical or serious accessibility violations", async () => {
    const { container } = render(<UptimeBars rows={ROWS} />);
    const results = await axe.run(container);
    const serious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(serious).toEqual([]);
  });
});
