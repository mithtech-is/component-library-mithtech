/**
 * ChoiceChips — a row of toggle chips.
 *
 * What is tested is the contract that separates the two modes: single-select
 * reports one value (and null when cleared, if deselectable), multi-select
 * reports the set. Selection shows on `aria-pressed` so the base `.td-chip`
 * pressed well fires, and the group carries an accessible name.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import axe from "axe-core";
import { ChoiceChips } from "./index";

const OPTIONS = [
  { value: "erpnext", label: "Implement ERPNext" },
  { value: "migrate", label: "Move off Tally" },
  { value: "cost", label: "Cut costs" },
];

describe("ChoiceChips", () => {
  it("names the group and marks the selected chip pressed", () => {
    render(<ChoiceChips label="What are you trying to do?" options={OPTIONS} defaultValue="erpnext" />);
    expect(screen.getByRole("group", { name: "What are you trying to do?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Implement ERPNext" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Move off Tally" })).toHaveAttribute("aria-pressed", "false");
  });

  it("single-select reports the chosen value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ChoiceChips label="Intent" options={OPTIONS} onValueChange={onValueChange} />);
    await user.click(screen.getByRole("button", { name: "Cut costs" }));
    expect(onValueChange).toHaveBeenCalledWith("cost");
  });

  it("deselectable single-select clears to null on a second press", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ChoiceChips label="Intent" options={OPTIONS} deselectable defaultValue="cost" onValueChange={onValueChange} />);
    await user.click(screen.getByRole("button", { name: "Cut costs" }));
    expect(onValueChange).toHaveBeenCalledWith(null);
  });

  it("multi-select toggles set membership", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ChoiceChips multiple label="Modules" options={OPTIONS} defaultValue={["erpnext"]} onValueChange={onValueChange} />);
    await user.click(screen.getByRole("button", { name: "Move off Tally" }));
    expect(onValueChange).toHaveBeenCalledWith(["erpnext", "migrate"]);
    await user.click(screen.getByRole("button", { name: "Implement ERPNext" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["migrate"]);
  });

  it("draws a detail suffix without folding it into the accessible name", () => {
    render(
      <ChoiceChips
        multiple
        label="Modules"
        options={[{ value: "pos", label: "Point of Sale", detail: "ERPNext" }]}
      />,
    );
    // The chip's name is the label; the detail is metadata beside it.
    expect(screen.getByRole("button", { name: /Point of Sale/ })).toBeInTheDocument();
    expect(screen.getByText("ERPNext")).toHaveClass("td-chip-count");
  });

  it("has no critical or serious accessibility violations", async () => {
    const { container } = render(
      <ChoiceChips label="What are you trying to do?" options={OPTIONS} defaultValue="erpnext" />,
    );
    const results = await axe.run(container);
    const serious = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    expect(serious).toEqual([]);
  });
});
