/**
 * Segmented — a single-select inline control.
 *
 * What is tested is the contract: it is a named group of `aria-pressed` buttons
 * with exactly one pressed at a time; it runs uncontrolled from `defaultValue`
 * and controlled from `value`; a controlled component does not move on its own;
 * and a disabled segment stays in place but cannot be picked.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import axe from "axe-core";
import { Segmented } from "./index";

const VIEW = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

describe("Segmented", () => {
  it("is a named group with exactly one pressed segment", () => {
    render(<Segmented label="View" defaultValue="week" options={VIEW} />);
    expect(screen.getByRole("group", { name: "View" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Week" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Day" })).toHaveAttribute("aria-pressed", "false");
  });

  it("selects the first enabled option when given no value", () => {
    render(
      <Segmented
        label="View"
        options={[{ value: "day", label: "Day", disabled: true }, { value: "week", label: "Week" }]}
      />,
    );
    expect(screen.getByRole("button", { name: "Week" })).toHaveAttribute("aria-pressed", "true");
  });

  it("moves the selection itself when uncontrolled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Segmented label="View" defaultValue="day" options={VIEW} onValueChange={onValueChange} />);
    await user.click(screen.getByRole("button", { name: "Month" }));
    expect(onValueChange).toHaveBeenCalledWith("month");
    expect(screen.getByRole("button", { name: "Month" })).toHaveAttribute("aria-pressed", "true");
  });

  it("does not move on its own when controlled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Segmented label="View" value="day" options={VIEW} onValueChange={onValueChange} />);
    await user.click(screen.getByRole("button", { name: "Week" }));
    // The caller owns the value: onValueChange fires, but the pressed segment
    // stays put until the caller passes a new value.
    expect(onValueChange).toHaveBeenCalledWith("week");
    expect(screen.getByRole("button", { name: "Day" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Week" })).toHaveAttribute("aria-pressed", "false");
  });

  it("leaves a disabled segment in place but unpickable", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Segmented
        label="Sort"
        defaultValue="active"
        onValueChange={onValueChange}
        options={[{ value: "active", label: "Active" }, { value: "closing", label: "Closing", disabled: true }]}
      />,
    );
    const closing = screen.getByRole("button", { name: "Closing" });
    expect(closing).toBeDisabled();
    await user.click(closing);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("has no critical or serious accessibility violations", async () => {
    const { container } = render(<Segmented label="View" defaultValue="week" options={VIEW} />);
    const results = await axe.run(container);
    const serious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(serious).toEqual([]);
  });
});
