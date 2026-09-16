/**
 * Spinner — an indeterminate busy indicator.
 *
 * jsdom runs no animation, so what is tested is the contract a hand-rolled
 * spinner gets wrong: it is a `role="status"` live region with a real name (not
 * a bare, silent ring), it sizes from a prop rather than a fixed stylesheet
 * value, and its ring stays proportional as it scales.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import axe from "axe-core";
import { Spinner } from "./index";

describe("Spinner", () => {
  it("is a status live region with a default accessible name", () => {
    render(<Spinner />);
    const spinner = screen.getByRole("status");
    expect(spinner).toHaveAttribute("aria-label", "Loading");
  });

  it("names what is loading when told", () => {
    render(<Spinner label="Loading invoices" />);
    expect(screen.getByRole("status", { name: "Loading invoices" })).toBeInTheDocument();
  });

  it("sizes from the size prop and scales the ring with it", () => {
    render(<Spinner size={36} label="Loading" />);
    const spinner = screen.getByRole("status");
    expect(spinner.style.width).toBe("36px");
    expect(spinner.style.height).toBe("36px");
    // Thickness defaults to ~size/9, so a large spinner gets a thicker ring
    // rather than a fixed hairline that vanishes.
    expect(spinner.style.borderWidth).toBe("4px");
  });

  it("takes an explicit thickness over the proportional default", () => {
    render(<Spinner size={36} thickness={2} label="Loading" />);
    expect(screen.getByRole("status").style.borderWidth).toBe("2px");
  });

  it("has no critical or serious accessibility violations", async () => {
    const { container } = render(<Spinner label="Loading invoices" />);
    const results = await axe.run(container);
    const serious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(serious).toEqual([]);
  });
});
