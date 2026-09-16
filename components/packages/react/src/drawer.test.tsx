/**
 * Drawer — a modal edge panel.
 *
 * What is tested is the modal contract it inherits from the Dialog: it is not in
 * the tree until open, then it is a named modal dialog; Escape, the close button
 * and a scrim click all ask to close; focus moves inside on open; the side is
 * exposed for the CSS; and the body scroll is locked while it is open and
 * released when it closes.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import axe from "axe-core";
import { Drawer } from "./index";

function open(extra = {}) {
  const onOpenChange = vi.fn();
  const utils = render(
    <Drawer open onOpenChange={onOpenChange} title="Runbook" description="On-call detail" {...extra}>
      <button type="button">Inside</button>
    </Drawer>,
  );
  return { onOpenChange, ...utils };
}

describe("Drawer", () => {
  it("is absent until open", () => {
    render(
      <Drawer open={false} onOpenChange={() => {}} title="Runbook">
        <p>Body</p>
      </Drawer>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("is a named modal dialog when open", () => {
    open();
    const dialog = screen.getByRole("dialog", { name: "Runbook" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = open();
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes on the close button and on a scrim click", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = open();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);

    onOpenChange.mockClear();
    const scrim = document.querySelector(".td-overlay-backdrop")!;
    fireEvent.mouseDown(scrim);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("moves focus inside on open and exposes the side", () => {
    open({ side: "left" });
    expect(screen.getByRole("button", { name: "Inside" })).toHaveFocus();
    expect(screen.getByRole("dialog")).toHaveAttribute("data-side", "left");
  });

  it("locks the body scroll while open and releases it on close", () => {
    const { rerender, onOpenChange } = open();
    expect(document.body.style.overflow).toBe("hidden");
    rerender(
      <Drawer open={false} onOpenChange={onOpenChange} title="Runbook">
        <button type="button">Inside</button>
      </Drawer>,
    );
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("has no critical or serious accessibility violations", async () => {
    const { container } = open();
    // The dialog is portalled to the body, so scan the whole document.
    const results = await axe.run(document.body);
    const serious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(serious).toEqual([]);
    void container;
  });
});
