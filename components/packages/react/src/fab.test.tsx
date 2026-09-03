/**
 * The floating action button — the single action, and the speed dial.
 *
 * jsdom lays nothing out, so the fan geometry is not tested here; what is, is
 * the behaviour a hand-built FAB gets wrong — the dial that ships inert until
 * wired, the actions that stay in the tab order while closed, the fixed box
 * trapped in a transformed ancestor, and the wall of fills.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import axe from "axe-core";
import { FloatingActionButton } from "./index";

const ACTIONS = [
  { icon: <svg />, label: "New note" },
  { icon: <svg />, label: "Email" },
];

describe("FloatingActionButton", () => {
  it("is a single action when given no list", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<FloatingActionButton pinned={false} label="Create" onClick={onClick} />);
    const button = screen.getByRole("button", { name: "Create" });
    // Not a dial: no expanded state to advertise, and no menu.
    expect(button).not.toHaveAttribute("aria-expanded");
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("opens and closes the dial, and says so", async () => {
    const user = userEvent.setup();
    render(<FloatingActionButton pinned={false} label="Actions" actions={ACTIONS} />);
    const main = screen.getByRole("button", { name: "Actions" });
    expect(main).toHaveAttribute("aria-expanded", "false");
    await user.click(main);
    expect(main).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menu", { name: "Actions" })).toBeInTheDocument();
    await user.click(main);
    expect(main).toHaveAttribute("aria-expanded", "false");
  });

  it("owns its open state, so the dial is not inert until wired", async () => {
    // A control that does nothing until the page hooks it up ships broken.
    const user = userEvent.setup();
    render(<FloatingActionButton pinned={false} label="Actions" actions={ACTIONS} />);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getByRole("menuitem", { name: "New note" })).toBeInTheDocument();
  });

  it("fires an action and folds the dial back", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <FloatingActionButton
        pinned={false}
        label="Actions"
        actions={[{ icon: <svg />, label: "New note", onClick }]}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "New note" }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Actions" })).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on Escape and on a click outside", async () => {
    const user = userEvent.setup();
    render(
      <>
        <FloatingActionButton pinned={false} label="Actions" actions={ACTIONS} />
        <button type="button">Elsewhere</button>
      </>,
    );
    const main = screen.getByRole("button", { name: "Actions" });
    await user.click(main);
    await user.keyboard("{Escape}");
    expect(main).toHaveAttribute("aria-expanded", "false");
    // And an outside pointer-down.
    await user.click(main);
    await user.click(screen.getByRole("button", { name: "Elsewhere" }));
    expect(main).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps the closed actions out of the tab order", async () => {
    render(<FloatingActionButton pinned={false} label="Actions" actions={ACTIONS} />);
    // Closed: reachable in the DOM (so it can animate) but not tabbable.
    for (const item of screen.getAllByRole("menuitem", { hidden: true })) {
      expect(item).toHaveAttribute("tabindex", "-1");
    }
  });

  it("portals a pinned FAB to the body, and leaves an unpinned one in place", () => {
    const { container, rerender } = render(<FloatingActionButton label="Create" onClick={() => {}} />);
    // Pinned (the default): it escapes the render subtree for the body, because
    // `position: fixed` resolves against a transformed ancestor.
    expect(container.querySelector(".td-react-fab")).toBeNull();
    expect(document.body.querySelector(".td-react-fab")?.parentElement).toBe(document.body);
    rerender(<FloatingActionButton pinned={false} label="Create" onClick={() => {}} />);
    expect(container.querySelector(".td-react-fab")).not.toBeNull();
  });

  it("derives the fan from the corner, and takes an override", () => {
    const { rerender } = render(<FloatingActionButton pinned={false} label="A" actions={ACTIONS} corner="top-start" />);
    expect(document.querySelector(".td-react-fab")).toHaveAttribute("data-expand", "down");
    rerender(<FloatingActionButton pinned={false} label="A" actions={ACTIONS} corner="top-start" expand="right" />);
    expect(document.querySelector(".td-react-fab")).toHaveAttribute("data-expand", "right");
  });

  it("makes the main button loud and keeps the actions quiet", async () => {
    // One filled call to action; the dial's children are the carved surface,
    // never a wall of fills ([[L11]]).
    const user = userEvent.setup();
    render(<FloatingActionButton pinned={false} label="Actions" tone="papaya" actions={ACTIONS} />);
    expect(screen.getByRole("button", { name: "Actions" })).toHaveClass("td-glowicon--papaya");
    await user.click(screen.getByRole("button", { name: "Actions" }));
    for (const item of screen.getAllByRole("menuitem")) {
      expect(item).not.toHaveClass("td-glowicon--papaya");
    }
  });

  it("has no axe violations, open or shut", async () => {
    const user = userEvent.setup();
    const { container } = render(<FloatingActionButton pinned={false} label="Actions" actions={ACTIONS} />);
    expect((await axe.run(container)).violations).toEqual([]);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
