/**
 * LinkChip — a navigable pill.
 *
 * What is tested is the contract that separates it from `Chip`: the whole pill
 * is a link ([[L46]]), it carries the href, a `renderLink` hands the anchor to a
 * router, a leading glyph is decorative, and native anchor attributes pass
 * through.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import axe from "axe-core";
import { LinkChip } from "./index";

describe("LinkChip", () => {
  it("is a link — the whole pill — carrying the href", () => {
    render(<LinkChip href="/learn/erpnext">ERPNext</LinkChip>);
    const link = screen.getByRole("link", { name: "ERPNext" });
    expect(link).toHaveAttribute("href", "/learn/erpnext");
    // Unlike Chip, the token itself is the control, not a span.
    expect(link.tagName).toBe("A");
  });

  it("hands the anchor to renderLink when given, with the resolved class and href", () => {
    render(
      <LinkChip
        href="/products/commercely"
        renderLink={({ className, href, children }) => (
          <a data-router href={href} className={className}>
            {children}
          </a>
        )}
      >
        Commercely
      </LinkChip>,
    );
    const link = screen.getByRole("link", { name: "Commercely" });
    expect(link).toHaveAttribute("data-router");
    expect(link).toHaveAttribute("href", "/products/commercely");
    // The base pill class reaches the router's element.
    expect(link).toHaveClass("td-chip");
  });

  it("draws a leading glyph as decoration, not as a second label", () => {
    render(
      <LinkChip href="/learn" leading={<svg data-testid="glyph" />}>
        Guides
      </LinkChip>,
    );
    const glyph = screen.getByTestId("glyph");
    expect(glyph.parentElement).toHaveAttribute("aria-hidden");
    // The accessible name is the label alone.
    expect(screen.getByRole("link", { name: "Guides" })).toBeInTheDocument();
  });

  it("passes native anchor attributes through", () => {
    render(
      <LinkChip href="https://frappe.io" target="_blank" rel="noopener" data-testid="lc">
        Frappe
      </LinkChip>,
    );
    const link = screen.getByTestId("lc");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener");
  });

  it("has no critical or serious accessibility violations", async () => {
    const { container } = render(<LinkChip href="/learn/erpnext">ERPNext</LinkChip>);
    const results = await axe.run(container);
    const serious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(serious).toEqual([]);
  });
});
