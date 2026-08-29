import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import axe from "axe-core";
import { ApplicationShell, Button, ChartContainer, FilterBar, SiteNavigation, KpiCard, KpiGrid } from "./index";

describe("P2 dashboard composites", () => {
  it("renders KPI values and trend semantics without inventing chart meaning", () => {
    render(<KpiGrid aria-label="Metrics"><KpiCard label="Revenue" value="₹4.2M" delta="+12%" trend="up" /></KpiGrid>);
    expect(screen.getByRole("article")).toHaveTextContent("Revenue₹4.2M+12%");
    expect(screen.getByLabelText("Metrics")).toHaveClass("td-kpi-grid");
  });

  it("supports uncontrolled filter toggling and clearing", async () => {
    const user = userEvent.setup();
    render(<FilterBar options={[{ value: "open", label: "Open", count: 4 }, { value: "closed", label: "Closed" }]} defaultValue={["open"]} />);
    const open = screen.getByRole("button", { name: "Open4" });
    const closed = screen.getByRole("button", { name: "Closed" });
    expect(open).toHaveAttribute("aria-pressed", "true");
    await user.click(closed);
    expect(closed).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(open).toHaveAttribute("aria-pressed", "false");
    expect(closed).toHaveAttribute("aria-pressed", "false");
  });

  it("exposes current navigation destinations from SiteNavigation's flat form", () => {
    // `DesktopNavigation` was removed on 2026-08-29: a flat brand + links +
    // actions bar is SiteNavigation with link-only items and the retract off,
    // minus the panels, the sticky behaviour and the router seam. Two
    // components for one bar meant correcting the bar twice.
    render(<SiteNavigation retract={false} brand="TonalDepth" items={[
      { kind: "link", href: "/overview", label: "Overview", current: true },
      { kind: "link", href: "/reports", label: "Reports" },
    ]} />);
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
  });

  it("composes a labelled application shell with one main landmark", () => {
    render(<ApplicationShell identity="Workspace" title="Operations" description="Daily overview" sections={[{ label: "Work", items: [{ href: "/queue", label: "Queue", current: true, count: 8 }] }]} actions={<Button>Export</Button>}><p>Dashboard body</p></ApplicationShell>);
    expect(screen.getByRole("heading", { level: 1, name: "Operations" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Application navigation" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("Dashboard body");
  });

  it("provides chart context independently of a charting library", () => {
    render(<ChartContainer title="Orders" meta="Last 7 days" description="Orders rose from 20 to 36." legend={[{ label: "Orders", color: "red" }]}><svg role="img" aria-label="Orders line"><path /></svg></ChartContainer>);
    // The caption is the frame's title now: a chart is housed in a well, not
    // carried on a plate of its own.
    expect(screen.getByText("Orders", { selector: ".td-react-frame-title" })).toBeInTheDocument();
    expect(screen.getByText("Orders rose from 20 to 36.")).toHaveClass("td-react-visually-hidden");
    expect(screen.getByRole("img", { name: "Orders line" })).toBeInTheDocument();
  });

  it("has no critical or serious automated accessibility violations", async () => {
    const { container } = render(<><SiteNavigation retract={false} brand="TonalDepth" items={[{ kind: "link", href: "/", label: "Home", current: true }]} /><KpiCard label="Users" value="400" /><FilterBar options={[{ value: "active", label: "Active" }]} /><ChartContainer title="Users" description="400 active users"><svg role="img" aria-label="User trend" /></ChartContainer></>);
    const result = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(result.violations.filter(item => item.impact === "critical" || item.impact === "serious")).toEqual([]);
  });
});
