import {
  Badge, Card, CardContent, CardHeader, CardTitle, CodeBlock, Counter, CounterRow,
  FilePreview, FormField, Input, IsoStack, Progress, ReadingProgress, SubNav,
  Terminal, Testimonial, Timeline, Tooltip,
} from "@mithtech-bengaluru/tonaldepth-react";
import { ClientActions } from "./client-actions";

/**
 * A React Server Component that renders every component added in the second
 * 2026-08-29 build.
 *
 * This page is the only thing that proves the client boundaries are right.
 * `pnpm build:react` is green whether or not `icons.ts` and the stateful
 * components carry "use client" — the failure only appears when Next collects
 * page data, as `createContext is not a function` ([[L22]]). So the ones below
 * are rendered FROM a server component on purpose: a server component may
 * render a client one, and if a boundary is missing this build is where it
 * shows.
 *
 * Anything needing a function prop cannot be reached from here — a server
 * component cannot pass a callback — so Spotlight and ConfirmButton live in
 * `client-actions.tsx` instead.
 */
export default function Page() {
  return (
    <main className="td-container td-container--3" style={{ margin: "0 auto", padding: "var(--td-sp-10)" }}>
      {/* Client, and fixed to the viewport. */}
      <ReadingProgress target="main" />
      <Card>
        <CardHeader><CardTitle>Next.js packed consumer</CardTitle><Badge variant="success">App Router</Badge></CardHeader>
        <CardContent className="td-form">
          <FormField label="Workspace" helperText="Server-rendered field">
            <Input defaultValue="Mithtech Bengaluru" />
          </FormField>
          <ClientActions />
        </CardContent>
      </Card>

      {/* Client, reached from a server component. */}
      <CounterRow>
        <Counter value={23} label="Engagements" />
        <Counter value={98} suffix="%" label="Retention" />
      </CounterRow>

      {/* Server-renderable, all of them. */}
      <Timeline axis="flow" items={[{ title: "Lint", state: "done" }, { title: "Build", state: "current" }, { title: "Deploy", state: "upcoming" }]} />
      <Timeline axis="feed" items={[{ title: "Sameer deployed v2.4.1", time: "just now", initials: "SK" }]} />
      <Timeline marker="ordinal" items={[{ title: "Discovery", time: "Aug 02", state: "done" }, { title: "Rollout", time: "Aug 22", state: "current" }]} />
      <Progress label="Triennial re-evaluation" value={78} status={<Badge variant="success">On track</Badge>} />
      <Terminal title="deploy" live lines={[{ kind: "command", text: "docker compose up -d" }, { kind: "ok", text: "Deploy complete in 11.2s" }]} />
      <CodeBlock diff title="webhooks.ts" code={"--- a/webhooks.ts\n+++ b/webhooks.ts\n const sig = req.headers.get('stripe-signature');\n-if (!sig) return new Response('missing', { status: 400 });\n+if (!sig) return new Response('missing', { status: 400, headers: { 'x-error': 'no-sig' } });"} />
      <FilePreview name="Discovery-SOW.pdf" meta="142 KB · 4 pages · 17 Aug" href="/files/sow.pdf" />
      <Testimonial name="Rajesh Sharma" role="CTO · Rajesh & Co" initials="RS">They owned the deploy, the on-call rotation and the runbook.</Testimonial>
      <IsoStack label="Engagements" cards={[{ eyebrow: "Q1 2026", title: "Commercely" }, { eyebrow: "Q2 2026", title: "Planely" }]} />
      <SubNav label="Settings" sections={[{ label: "Workspace", items: [{ label: "General", href: "/general", count: 12 }, { label: "Billing", href: "/billing", current: true }] }]} />
      <p>
        Payment for{" "}
        <Tooltip variant="peek" content={<span>Mistry &amp; Co — ₹2,04,900 outstanding, 6d overdue</span>}>
          <button type="button">INV-0231</button>
        </Tooltip>{" "}
        is overdue.
      </p>
    </main>
  );
}
