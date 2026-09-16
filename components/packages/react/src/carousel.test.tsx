/**
 * Carousel — a horizontal scroll-snap strip.
 *
 * jsdom does not scroll, so what is tested is the contract: it is a focusable,
 * named scroll region holding its children; the hint can be dropped; and
 * CarouselCard renders its parts and exposes its tone.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import axe from "axe-core";
import { Carousel, CarouselCard } from "./index";

describe("Carousel", () => {
  it("is a focusable, named scroll region holding its children", () => {
    render(
      <Carousel label="Recent work">
        <CarouselCard title="One" />
        <CarouselCard title="Two" />
      </Carousel>,
    );
    const region = screen.getByRole("region", { name: "Recent work" });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(region).toHaveTextContent("One");
    expect(region).toHaveTextContent("Two");
  });

  it("shows a default hint that can be dropped", () => {
    const { rerender } = render(
      <Carousel label="Recent work">
        <CarouselCard title="One" />
      </Carousel>,
    );
    expect(screen.getByText("Scroll →")).toBeInTheDocument();
    rerender(
      <Carousel label="Recent work" hint={null}>
        <CarouselCard title="One" />
      </Carousel>,
    );
    expect(screen.queryByText("Scroll →")).not.toBeInTheDocument();
  });

  it("renders a card's parts and exposes its tone", () => {
    const { container } = render(
      <CarouselCard eyebrow="Commercely" title="Headless commerce" tone="accent" cta="Read case study →">
        Medusa storefront on Hetzner.
      </CarouselCard>,
    );
    expect(screen.getByText("Commercely")).toBeInTheDocument();
    expect(screen.getByText("Headless commerce")).toBeInTheDocument();
    expect(screen.getByText("Medusa storefront on Hetzner.")).toBeInTheDocument();
    expect(screen.getByText("Read case study →")).toBeInTheDocument();
    expect(container.querySelector(".td-carousel-card")).toHaveAttribute("data-tone", "accent");
  });

  it("has no critical or serious accessibility violations", async () => {
    const { container } = render(
      <Carousel label="Recent work">
        <CarouselCard eyebrow="Commercely" title="Headless commerce" cta="Read case study →">
          Medusa on Hetzner.
        </CarouselCard>
        <CarouselCard eyebrow="Planely" tone="accent" title="Self-hosted Plane">
          Plane on po5.
        </CarouselCard>
      </Carousel>,
    );
    const results = await axe.run(container);
    const serious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(serious).toEqual([]);
  });
});
