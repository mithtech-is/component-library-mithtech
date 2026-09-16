/**
 * Gauge — a compact load meter.
 *
 * jsdom lays nothing out, so the bar heights are not asserted; what is, is the
 * contract: it is a named `meter` carrying its (clamped) value to assistive
 * tech, the band is derived from the value but yields to an explicit `load`, the
 * readout is formattable, and the strip holds the requested number of bars.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import axe from "axe-core";
import { Gauge } from "./index";

describe("Gauge", () => {
  it("is a named meter carrying its value", () => {
    render(<Gauge value={22} label="CPU" />);
    const meter = screen.getByRole("meter", { name: "CPU" });
    expect(meter).toHaveAttribute("aria-valuenow", "22");
    expect(meter).toHaveAttribute("aria-valuemin", "0");
    expect(meter).toHaveAttribute("aria-valuemax", "100");
    expect(screen.getByText("22%")).toBeInTheDocument();
    expect(screen.getByText("CPU")).toBeInTheDocument();
  });

  it("derives the band from the value", () => {
    const { rerender } = render(<Gauge value={22} label="CPU" />);
    expect(screen.getByRole("meter")).toHaveAttribute("data-load", "low");
    rerender(<Gauge value={58} label="CPU" />);
    expect(screen.getByRole("meter")).toHaveAttribute("data-load", "med");
    rerender(<Gauge value={84} label="CPU" />);
    expect(screen.getByRole("meter")).toHaveAttribute("data-load", "high");
  });

  it("lets an explicit load override the derived band", () => {
    render(<Gauge value={10} label="Headroom" load="high" />);
    expect(screen.getByRole("meter")).toHaveAttribute("data-load", "high");
  });

  it("clamps the value into 0–100", () => {
    const { rerender } = render(<Gauge value={150} label="CPU" />);
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "100");
    rerender(<Gauge value={-20} label="CPU" />);
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "0");
  });

  it("draws the requested number of bars and formats the readout", () => {
    const { container } = render(
      <Gauge value={50} label="RAM" bars={8} format={(v) => `${v} of 100`} />,
    );
    expect(container.querySelectorAll(".td-gauge-bar")).toHaveLength(8);
    expect(screen.getByText("50 of 100")).toBeInTheDocument();
  });

  it("has no critical or serious accessibility violations", async () => {
    const { container } = render(<Gauge value={58} label="RAM" />);
    const results = await axe.run(container);
    const serious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(serious).toEqual([]);
  });
});
