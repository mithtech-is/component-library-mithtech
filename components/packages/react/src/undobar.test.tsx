/**
 * UndoBar — the reversible-action bar.
 *
 * What is tested is the behaviour: it is a status live region carrying the
 * message and an Undo control; Undo calls back and does not also commit; the
 * commit fires on a timer (so it survives reduced motion, where the animation
 * does not); and Undo and commit each fire at most once.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import axe from "axe-core";

import { UndoBar } from "./index";

afterEach(() => {
  vi.useRealTimers();
});

describe("UndoBar", () => {
  it("is a status region with the message and an Undo control", () => {
    render(
      <UndoBar onUndo={() => {}}>
        <strong>Invoice INV-0231 archived.</strong>
      </UndoBar>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Invoice INV-0231 archived.");
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
  });

  it("calls onUndo on press and does not commit", async () => {
    const user = userEvent.setup();
    const onUndo = vi.fn();
    const onCommit = vi.fn();
    render(
      <UndoBar onUndo={onUndo} onCommit={onCommit}>
        Archived
      </UndoBar>,
    );
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("commits on a timer, not on the animation", () => {
    vi.useFakeTimers();
    const onCommit = vi.fn();
    render(
      <UndoBar onUndo={() => {}} onCommit={onCommit} duration={6}>
        Archived
      </UndoBar>,
    );
    expect(onCommit).not.toHaveBeenCalled();
    vi.advanceTimersByTime(6000);
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it("an undo cancels the pending commit", () => {
    // fireEvent (synchronous) rather than userEvent here: userEvent awaits real
    // microtasks, which deadlocks against fake timers.
    vi.useFakeTimers();
    const onUndo = vi.fn();
    const onCommit = vi.fn();
    render(
      <UndoBar onUndo={onUndo} onCommit={onCommit} duration={6}>
        Archived
      </UndoBar>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    vi.advanceTimersByTime(6000);
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("has no critical or serious accessibility violations", async () => {
    const { container } = render(
      <UndoBar onUndo={() => {}}>
        <strong>Invoice INV-0231 archived.</strong>
      </UndoBar>,
    );
    const results = await axe.run(container);
    const serious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(serious).toEqual([]);
  });
});
