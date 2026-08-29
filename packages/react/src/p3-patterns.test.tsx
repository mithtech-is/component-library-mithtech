import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import axe from "axe-core";
import { Button, DashboardPage, DashboardPanel, DataManagementPage, FilterBar, KpiCard, KpiGrid, PageState, Table, TableBody, TableCell, TableContainer, TableHead, TableHeader, TableRow } from "./index";

describe("P3 page patterns", () => {
  it("composes a dashboard without owning application data", () => {
    render(<DashboardPage title="Operations" description="Daily overview" actions={<Button>Export</Button>} filters={<FilterBar options={[{ value: "active", label: "Active" }]} />} metrics={<KpiGrid><KpiCard label="Orders" value="42" /></KpiGrid>}><DashboardPanel title="Queue" meta="Live">Consumer chart</DashboardPanel><DashboardPanel title="Exceptions" span={2}>Consumer table</DashboardPanel></DashboardPage>);
    expect(screen.getByRole("heading", { level: 2, name: "Operations" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Queue" })).toHaveTextContent("Consumer chart");
    expect(screen.getByRole("button", { name: "Active" })).toHaveAttribute("aria-pressed", "false");
  });

  it("composes data-management content and footer controls", () => {
    render(<DataManagementPage title="Orders" toolbar={<label>Search <input /></label>} footer={<Button>Next</Button>}><TableContainer><Table><TableHead><TableRow><TableHeader>Order</TableHeader></TableRow></TableHead><TableBody><TableRow><TableCell>#42</TableCell></TableRow></TableBody></Table></TableContainer></DataManagementPage>);
    expect(screen.getByRole("heading", { name: "Orders" })).toBeInTheDocument();
    expect(screen.getByRole("table")).toHaveTextContent("#42");
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
  });

  it.each([
    ["empty", "status", false],
    ["loading", "status", true],
    ["error", "alert", false],
  ] as const)("exposes the %s page state", (variant, role, busy) => {
    render(<PageState variant={variant} title={`${variant} title`} description="State description" action={<Button>Retry</Button>} />);
    const state = screen.getByRole(role);
    expect(state).toHaveTextContent(`${variant} titleState descriptionRetry`);
    if (busy) expect(state).toHaveAttribute("aria-busy", "true");
  });

  it("has no critical or serious automated accessibility violations", async () => {
    const { container } = render(<DashboardPage title="Analytics" metrics={<KpiGrid><KpiCard label="Users" value="400" /></KpiGrid>}><DashboardPanel title="Trend"><svg role="img" aria-label="User trend" /></DashboardPanel></DashboardPage>);
    const result = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(result.violations.filter(item => item.impact === "critical" || item.impact === "serious")).toEqual([]);
  });
});
