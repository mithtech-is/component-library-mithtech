/**
 * InlineEdit — click-to-edit.
 *
 * What is tested is the behaviour: it reads as a named control until clicked,
 * becomes a named field when it is, commits on Enter and on blur, discards on
 * Escape, and — the trap this component exists to get right — a commit and a
 * discard never both fire when Enter also blurs the field.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import axe from "axe-core";
import { InlineEdit } from "./index";

describe("InlineEdit", () => {
  it("reads as an edit control and becomes a named field on click", async () => {
    const user = userEvent.setup();
    render(<InlineEdit label="Project" value="Commercely" onValueChange={() => {}} />);
    const display = screen.getByRole("button", { name: "Edit Project" });
    expect(display).toHaveTextContent("Commercely");
    await user.click(display);
    const field = screen.getByRole("textbox", { name: "Project" });
    expect(field).toHaveFocus();
  });

  it("commits the edited value on Enter, exactly once", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<InlineEdit label="Project" value="Old" onValueChange={onValueChange} />);
    await user.click(screen.getByRole("button", { name: "Edit Project" }));
    const field = screen.getByRole("textbox", { name: "Project" });
    await user.clear(field);
    await user.type(field, "New{Enter}");
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("New");
    // Back to the display control.
    expect(screen.getByRole("button", { name: "Edit Project" })).toBeInTheDocument();
  });

  it("discards on Escape", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<InlineEdit label="Project" value="Old" onValueChange={onValueChange} />);
    await user.click(screen.getByRole("button", { name: "Edit Project" }));
    const field = screen.getByRole("textbox", { name: "Project" });
    await user.clear(field);
    await user.type(field, "New{Escape}");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Edit Project" })).toHaveTextContent("Old");
  });

  it("commits on blur", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <div>
        <InlineEdit label="Project" value="Old" onValueChange={onValueChange} />
        <button type="button">Elsewhere</button>
      </div>,
    );
    await user.click(screen.getByRole("button", { name: "Edit Project" }));
    await user.type(screen.getByRole("textbox", { name: "Project" }), " updated");
    await user.click(screen.getByRole("button", { name: "Elsewhere" }));
    expect(onValueChange).toHaveBeenCalledWith("Old updated");
  });

  it("shows a muted placeholder when empty", () => {
    render(<InlineEdit label="Note" value="" placeholder="Add a note" onValueChange={() => {}} />);
    const display = screen.getByRole("button", { name: "Edit Note" });
    expect(display).toHaveTextContent("Add a note");
    expect(display).toHaveAttribute("data-empty");
  });

  it("has no critical or serious accessibility violations", async () => {
    const { container } = render(<InlineEdit label="Project" value="Commercely" onValueChange={() => {}} />);
    const results = await axe.run(container);
    const serious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(serious).toEqual([]);
  });
});
