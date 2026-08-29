import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Alert, ApplicationShell, Badge, Button, Card, CardContent, CardHeader, CardTitle,
  ChartContainer, Checkbox, DashboardPage, DashboardPanel, DataManagementPage,
  Dialog, DropdownMenu, FilterBar, SiteNavigation,
  FormField, Input, KpiCard, KpiGrid, PageState, Radio, RadioGroup, Switch, Table, TableBody,
  TableCell, TableContainer, TableHead, TableHeader, TableRow, Tabs, Textarea,
  ToastProvider, Tooltip, useToast,
} from "@mithtech-bengaluru/tonaldepth-react";
import "@mithtech-bengaluru/tonaldepth-react/styles.css";
import "./catalog.css";

function Catalog() {
  const [dark, setDark] = useState(false);
  const [compact, setCompact] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [plan, setPlan] = useState("pro");
  const [region, setRegion] = useState("india");
  const [filters, setFilters] = useState(["active"]);
  const { toast } = useToast();

  function applyTheme(value: boolean) {
    setDark(value);
    document.documentElement.dataset.theme = value ? "dark" : "light";
  }

  function applyDensity(value: boolean) {
    setCompact(value);
    document.documentElement.dataset.density = value ? "compact" : "comfortable";
  }

  return (
    <div className="catalog-shell">
      <header className="catalog-header">
        <div><Badge variant="brand">React alpha</Badge><h1 className="td-page-title">P1 component catalog</h1><p className="td-body">Typed adapters over the approved offline TonalDepth baseline—not a redesign.</p></div>
        <div className="td-btn-row"><Button size="sm" onClick={() => applyTheme(!dark)}>{dark ? "Light" : "Dark"} theme</Button><Button size="sm" onClick={() => applyDensity(!compact)}>{compact ? "Comfortable" : "Compact"}</Button></div>
      </header>

      <section className="catalog-grid" aria-label="Component examples">
        <Card><CardHeader><CardTitle>Buttons</CardTitle><Badge>Six variants</Badge></CardHeader><CardContent className="td-btn-row"><Button variant="primary">Primary</Button><Button variant="filled">Filled</Button><Button variant="secondary">Secondary</Button><Button variant="outline">Outline</Button><Button variant="ghost">Ghost</Button><Button variant="destructive">Destructive</Button><Button loading={saving} onClick={() => setSaving(true)}>{saving ? "Saving" : "Test loading"}</Button></CardContent></Card>
        <Card depth="inset"><CardHeader><CardTitle>Badges</CardTitle><Badge variant="success">Ready</Badge></CardHeader><CardContent className="catalog-row"><Badge>Neutral</Badge><Badge variant="brand">Brand</Badge><Badge variant="success">Success</Badge><Badge variant="accent">Accent</Badge><Badge variant="danger">Danger</Badge></CardContent></Card>
        <Card className="catalog-form-card"><CardHeader><CardTitle>Form fields</CardTitle><Badge variant="accent">Accessible</Badge></CardHeader><CardContent className="td-form"><FormField label="Work email" helperText="Used only for account notifications" required><Input type="email" placeholder="name@company.com" trailing="Required" /></FormField><FormField label="Project summary" error="Add at least one sentence"><Textarea placeholder="Describe the work" /></FormField><Button variant="primary">Submit example</Button></CardContent></Card>

        <Card><CardHeader><CardTitle>Selection controls</CardTitle><Badge variant="success">Native inputs</Badge></CardHeader><CardContent className="catalog-stack"><Checkbox label="Email notifications" defaultChecked /><RadioGroup legend="Deployment region" value={region} onChange={event => setRegion(event.target.value)}><Radio value="india" label="India" /><Radio value="singapore" label="Singapore" /></RadioGroup><Switch label="Automatic updates" defaultChecked /></CardContent></Card>
        <Card><CardHeader><CardTitle>Navigation</CardTitle><Badge variant="brand">Keyboard ready</Badge></CardHeader><CardContent className="catalog-stack"><Tabs defaultValue="overview" items={[{ value: "overview", label: "Overview", content: "Current project status and ownership." }, { value: "activity", label: "Activity", content: "Recent component-library changes." }, { value: "settings", label: "Settings", content: "Package and notification settings." }]} /><DropdownMenu label={plan === "pro" ? "Pro plan" : "Basic plan"} value={plan} onValueChange={setPlan} items={[{ value: "basic", label: "Basic plan" }, { value: "pro", label: "Pro plan" }, { value: "enterprise", label: "Enterprise", disabled: true }]} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Feedback</CardTitle><Badge variant="accent">Live regions</Badge></CardHeader><CardContent className="catalog-stack"><Alert variant="info" title="Information">The alpha package is installed locally.</Alert><Alert variant="success" title="Ready">P1 tests are passing.</Alert><div className="td-btn-row"><Tooltip content="Opens contextual guidance"><Button variant="outline">Hover or focus</Button></Tooltip><Button onClick={() => toast({ title: "Saved", description: "The catalog action completed.", variant: "success" })}>Show toast</Button><Button variant="primary" onClick={() => setDialogOpen(true)}>Open dialog</Button></div></CardContent></Card>
        <Card><CardHeader><CardTitle>Table</CardTitle><Badge>Semantic HTML</Badge></CardHeader><CardContent><TableContainer><Table><TableHead><TableRow><TableHeader scope="col">Package</TableHeader><TableHeader scope="col">State</TableHeader><TableHeader scope="col">Tests</TableHeader></TableRow></TableHead><TableBody><TableRow><TableCell>React</TableCell><TableCell><Badge variant="success">Verified</Badge></TableCell><TableCell>15</TableCell></TableRow><TableRow><TableCell>Core</TableCell><TableCell><Badge variant="success">Verified</Badge></TableCell><TableCell>7</TableCell></TableRow></TableBody></Table></TableContainer></CardContent></Card>
      </section>

      <section className="catalog-p2" aria-labelledby="p2-title">
        <div className="catalog-section-head"><Badge variant="brand">P2 composites</Badge><h2 id="p2-title" className="td-page-title">Dashboard composition</h2></div>
        <SiteNavigation retract={false} brand="TONALDEPTH" items={[{ kind: "link", href: "#overview", label: "Overview", current: true }, { href: "#analytics", label: "Analytics" }, { href: "#settings", label: "Settings" }]} actions={<Button size="sm">New report</Button>} />
        <KpiGrid><KpiCard label="Revenue" value="₹4.2M" delta="+12.4%" trend="up" /><KpiCard label="Orders" value="1,284" delta="+8.1%" trend="up" /><KpiCard label="Returns" value="24" delta="-3.2%" trend="down" /><KpiCard label="SLA" value="98.6%" delta="Stable" trend="neutral" /></KpiGrid>
        <FilterBar value={filters} onValueChange={setFilters} options={[{ value: "active", label: "Active", count: 18 }, { value: "review", label: "Needs review", count: 4, color: "accent" }, { value: "closed", label: "Closed", count: 32 }]} />
        <ChartContainer title="Weekly throughput" meta="Last 7 days" description="Throughput increased from 42 to 79 completed items." legend={[{ label: "Completed", color: "var(--td-series-1)" }]}><svg viewBox="0 0 600 150" role="img" aria-label="Weekly throughput rising from 42 to 79"><path d="M10 124 L105 108 L200 114 L295 78 L390 88 L485 48 L590 28" fill="none" stroke="var(--td-series-1)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></svg></ChartContainer>
        <ApplicationShell identity={<><span className="td-sb-logo">TD</span><span><span className="td-sb-name">Operations</span><br /><span className="td-sb-sub">Workspace</span></span></>} title="Operations" description="Application-shell composition using the approved baseline." sections={[{ label: "Workspace", items: [{ href: "#queue", label: "Queue", current: true, count: 8 }, { href: "#reports", label: "Reports" }] }]} sidebarFooter={<span className="td-sb-user">Catalog user</span>} actions={<Button size="sm">Export</Button>}><Alert variant="info" title="Shell content">Application content remains consumer-owned and is supplied through children.</Alert></ApplicationShell>
      </section>

      <section className="catalog-p2" aria-labelledby="p3-title">
        <div className="catalog-section-head"><Badge variant="accent">P3 patterns</Badge><h2 id="p3-title" className="td-page-title">Page compositions</h2></div>
        <DashboardPage title="Operations dashboard" description="Reusable composition with consumer-owned metrics and content." actions={<Button size="sm">Export</Button>} filters={<FilterBar options={[{ value: "today", label: "Today" }, { value: "week", label: "This week" }]} defaultValue={["today"]} />} metrics={<KpiGrid><KpiCard label="Open" value="42" delta="+6" trend="up" /><KpiCard label="At risk" value="7" delta="-2" trend="down" /><KpiCard label="Resolved" value="128" delta="+18%" trend="up" /><KpiCard label="SLA" value="98.6%" delta="Stable" /></KpiGrid>}>
          <DashboardPanel title="Throughput" meta="Live" span={2}><ChartContainer title="Resolved work" description="Resolved work increased across the week."><svg viewBox="0 0 600 120" role="img" aria-label="Resolved work trend"><path d="M10 96 L120 88 L230 72 L340 78 L450 45 L590 24" fill="none" stroke="var(--td-series-1)" strokeWidth="5" /></svg></ChartContainer></DashboardPanel>
          <DashboardPanel title="Attention required"><PageState variant="empty" title="No escalations" description="There are no critical escalations in the current filter." /></DashboardPanel>
        </DashboardPage>
        <DataManagementPage title="Orders" description="Search, filter, data, and pagination remain consumer-owned." actions={<Button size="sm">New order</Button>} toolbar={<><span className="td-fbar-label">Order status</span><FilterBar options={[{ value: "open", label: "Open", count: 8 }, { value: "closed", label: "Closed", count: 24 }]} /><Input aria-label="Search orders" placeholder="Search orders" /></>} footer={<><Button size="sm" disabled>Previous</Button><Button size="sm">Next</Button></>}><TableContainer><Table><TableHead><TableRow><TableHeader>Order</TableHeader><TableHeader>Customer</TableHeader><TableHeader>Status</TableHeader></TableRow></TableHead><TableBody><TableRow><TableCell>#1042</TableCell><TableCell>MithTech</TableCell><TableCell><Badge variant="success">Ready</Badge></TableCell></TableRow></TableBody></Table></TableContainer></DataManagementPage>
        <div className="catalog-state-grid"><PageState variant="empty" title="No results" description="Adjust the current filters." action={<Button size="sm">Clear filters</Button>} /><PageState variant="loading" title="Loading data" description="Fetching the latest records." /><PageState variant="error" title="Unable to load" description="The request could not be completed." action={<Button size="sm">Retry</Button>} /></div>
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen} title="Confirm component action" description="This example validates focus management and dismissal." footer={<><Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button><Button variant="primary" onClick={() => setDialogOpen(false)}>Confirm</Button></>}><p className="td-body">Production dialogs retain the approved TonalDepth modal treatment.</p></Dialog>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><ToastProvider><Catalog /></ToastProvider></StrictMode>);
