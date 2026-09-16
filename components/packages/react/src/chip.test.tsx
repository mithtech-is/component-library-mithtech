/**
 * Chip — a filter token.
 *
 * What is tested is the contract and the thing it deliberately does NOT do: a
 * chip with no `onRemove` is a static token and offers no control ([[L12]]); the
 * × carries an accessible name so a reader clearing filters knows which one it
 * takes off; and the ×'s click does not escape to a handler on the token, so the
 * whole token can be made clickable without a remove double-firing it.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import axe from "axe-core";
import { Chip } from "./index";

describe("Chip", () => {
  it("is a static token with no control when given no onRemove", () => {
    render(<Chip>Self-hosted</Chip>);
    expect(screen.getByText("Self-hosted")).toBeInTheDocument();
    // The token itself is a span, not a button, and there is no × to press.
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("draws a named remove control and calls onRemove when it is pressed", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <Chip onRemove={onRemove} removeLabel="Remove ERPNext filter">
        ERPNext
      </Chip>,
    );
    const remove = screen.getByRole("button", { name: "Remove ERPNext filter" });
    await user.click(remove);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("keeps the remove click from reaching a handler on the token", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const onTokenClick = vi.fn();
    render(
      <Chip onRemove={onRemove} removeLabel="Remove India filter" onClick={onTokenClick}>
        India
      </Chip>,
    );
    await user.click(screen.getByRole("button", { name: "Remove India filter" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
    // The × stops propagation, so an outer handler does not also fire.
    expect(onTokenClick).not.toHaveBeenCalled();
  });

  it("passes native span attributes through", () => {
    render(
      <Chip title="applied filter" data-testid="chip">
        APAC
      </Chip>,
    );
    expect(screen.getByTestId("chip")).toHaveAttribute("title", "applied filter");
  });

  it("has no critical or serious accessibility violations", async () => {
    const { container } = render(
      <Chip onRemove={() => {}} removeLabel="Remove APAC filter">
        APAC
      </Chip>,
    );
    const results = await axe.run(container);
    const serious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(serious).toEqual([]);
  });
});
