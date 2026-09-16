/**
 * Popover — a click-triggered, non-modal panel.
 *
 * The behaviour is the whole point, and all of it is testable without layout:
 * it toggles and reports state on the trigger; the panel is a named dialog only
 * while open; focus moves into the panel on open and back to the trigger on
 * Escape; a click outside closes it; and a controlled popover does not move on
 * its own.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import axe from "axe-core";
import { Popover } from "./index";

describe("Popover", () => {
  it("advertises the dialog on the trigger and toggles it", async () => {
    const user = userEvent.setup();
    render(
      <Popover trigger="Details" title="Details">
        <p>Body</p>
      </Popover>,
    );
    const trigger = screen.getByRole("button", { name: "Details" });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    // Closed: the dialog is aria-hidden, so it is not in the a11y tree.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("dialog", { name: "Details" })).toBeInTheDocument();
  });

  it("moves focus into the panel on open and back to the trigger on Escape", async () => {
    const user = userEvent.setup();
    render(
      <Popover trigger="Details" title="Details">
        <p>Body</p>
      </Popover>,
    );
    const trigger = screen.getByRole("button", { name: "Details" });
    await user.click(trigger);
    expect(screen.getByRole("dialog")).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes on a click outside", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Popover trigger="Details" title="Details">
          <p>Body</p>
        </Popover>
        <button type="button">Elsewhere</button>
      </div>,
    );
    await user.click(screen.getByRole("button", { name: "Details" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Elsewhere" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("names the dialog with label when there is no title", async () => {
    const user = userEvent.setup();
    render(
      <Popover trigger="More" label="Engagement details">
        <p>Body</p>
      </Popover>,
    );
    await user.click(screen.getByRole("button", { name: "More" }));
    expect(screen.getByRole("dialog", { name: "Engagement details" })).toBeInTheDocument();
  });

  it("does not move on its own when controlled", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Popover trigger="Details" title="Details" open={false} onOpenChange={onOpenChange}>
        <p>Body</p>
      </Popover>,
    );
    await user.click(screen.getByRole("button", { name: "Details" }));
    // The caller owns `open`: the request is reported but the panel stays closed
    // until the caller flips the prop.
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("has no critical or serious accessibility violations when open", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Popover trigger="Details" title="Details">
        <p>Body</p>
      </Popover>,
    );
    await user.click(screen.getByRole("button", { name: "Details" }));
    const results = await axe.run(container);
    const serious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(serious).toEqual([]);
  });
});
