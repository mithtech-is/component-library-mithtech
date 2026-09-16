/**
 * Ring — a determinate circular meter.
 *
 * jsdom computes no SVG geometry, so what is tested is the contract: it is a
 * named `progressbar` carrying its value to assistive tech, the fraction it
 * drives the arc with is clamped to 0–1, the centre defaults to the percentage
 * and yields to an explicit child (or none), and tone is exposed for the CSS.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import axe from "axe-core";
import { Ring } from "./index";

describe("Ring", () => {
  it("is a named progressbar carrying its value", () => {
    render(<Ring value={75} label="Disk used" />);
    const bar = screen.getByRole("progressbar", { name: "Disk used" });
    expect(bar).toHaveAttribute("aria-valuenow", "75");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("shows the rounded percentage in the centre by default", () => {
    render(<Ring value={3} max={8} label="Goal" />);
    // 3/8 = 37.5% → 38%
    expect(screen.getByText("38%")).toBeInTheDocument();
  });

  it("drives the arc with a fraction clamped to 0–1", () => {
    const { rerender } = render(<Ring value={150} label="Over" />);
    expect(screen.getByRole("progressbar").style.getPropertyValue("--pct")).toBe("1");
    rerender(<Ring value={-20} label="Under" />);
    expect(screen.getByRole("progressbar").style.getPropertyValue("--pct")).toBe("0");
  });

  it("lets a child replace the centre, and null clear it", () => {
    const { rerender } = render(<Ring value={8} max={10} label="Goal">8/10</Ring>);
    expect(screen.getByText("8/10")).toBeInTheDocument();
    expect(screen.queryByText("80%")).not.toBeInTheDocument();
    rerender(<Ring value={8} max={10} label="Goal">{null}</Ring>);
    expect(screen.queryByText("80%")).not.toBeInTheDocument();
    expect(screen.queryByText("8/10")).not.toBeInTheDocument();
  });

  it("exposes the tone for the fill colour", () => {
    render(<Ring value={50} tone="green" label="Uptime" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("data-tone", "green");
  });

  it("has no critical or serious accessibility violations", async () => {
    const { container } = render(<Ring value={75} label="Disk used" />);
    const results = await axe.run(container);
    const serious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(serious).toEqual([]);
  });
});
