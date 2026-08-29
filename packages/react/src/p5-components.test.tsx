/**
 * The components added 2026-08-29 (second build) to close the last of the
 * open slots, plus the variants that closed slots WITHOUT a new component.
 *
 * The family tests are the important ones here. Four `11-domain` slots and one
 * `09-interaction` slot collapsed into axes on `Timeline`, and a collapse is
 * only honest if the axes actually render differently — otherwise the library
 * has one component claiming to be four. Each family test asserts the
 * difference, not just that the prop is accepted.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  Badge, CodeBlock, ConfirmButton, Counter, FilePreview, IsoStack, MultiStep,
  Progress, ReadingProgress, SearchBar, Spotlight, SubNav, Terminal, Testimonial, Timeline, Tooltip,
} from "./index";

const SRC = dirname(fileURLToPath(import.meta.url));
const read = (name: string) => readFileSync(join(SRC, name), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

/* ── Family A — a thing moving through ordered states ────────────────── */

const STEPS = [
  { title: "Lint", state: "done" as const },
  { title: "Build", state: "current" as const, time: "2m 04s" },
  { title: "Deploy", state: "upcoming" as const },
];

describe("Timeline — the ordered-state family", () => {
  it("renders the same three states on every axis", () => {
    for (const axis of ["elapsed", "period", "flow", "feed"] as const) {
      const { container, unmount } = render(<Timeline axis={axis} items={STEPS} label={axis} />);
      const states = [...container.querySelectorAll(".td-mk-timeline-item")].map(item => item.getAttribute("data-state"));
      expect(states, axis).toEqual(["done", "current", "upcoming"]);
      unmount();
    }
  });

  it("gives each axis its own modifier, so four slots are four looks", () => {
    const seen = new Set<string>();
    for (const axis of ["elapsed", "period", "flow", "feed"] as const) {
      const { container, unmount } = render(<Timeline axis={axis} items={STEPS} label={axis} />);
      const list = container.querySelector(".td-mk-timeline")!;
      expect(list.className, axis).toContain(`td-mk-timeline--${axis}`);
      seen.add(list.className);
      unmount();
    }
    // Four distinct class strings: a collapse that rendered identically would
    // mean the library shipped one component pretending to be four.
    expect(seen.size).toBe(4);
  });

  it("puts the period ABOVE the row and every other axis's time AFTER it", () => {
    const { container: roadmap } = render(<Timeline axis="period" items={[{ title: "Discovery", time: "Q1 2026" }]} />);
    expect(roadmap.querySelector(".td-mk-timeline-period")).toHaveTextContent("Q1 2026");
    expect(roadmap.querySelector(".td-mk-timeline-time")).toBeNull();

    for (const axis of ["elapsed", "flow", "feed"] as const) {
      const { container, unmount } = render(<Timeline axis={axis} items={[{ title: "Build", time: "2m" }]} />);
      expect(container.querySelector(".td-mk-timeline-time"), axis).toHaveTextContent("2m");
      expect(container.querySelector(".td-mk-timeline-period"), axis).toBeNull();
      unmount();
    }
  });

  it("numbers the steps on the ordinal marker, and ticks the ones behind you", () => {
    const { container } = render(<Timeline marker="ordinal" items={STEPS} />);
    const dots = [...container.querySelectorAll(".td-mk-timeline-dot")].map(dot => dot.textContent);
    // Done shows a tick rather than its number: once a step is behind you,
    // which number it was stops being the useful fact.
    expect(dots).toEqual(["✓", "2", "3"]);
  });

  it("leaves the dot empty on the default marker", () => {
    const { container } = render(<Timeline items={STEPS} />);
    expect(container.querySelector(".td-mk-timeline-dot")).toHaveTextContent("");
  });

  it("carries the person rather than a state mark on the feed axis", () => {
    const { container } = render(
      <Timeline axis="feed" items={[{ title: "Sameer deployed v2.4.1", initials: "SK", time: "just now" }]} />,
    );
    expect(container.querySelector(".td-mk-timeline-initials")).toHaveTextContent("SK");
  });

  it("ignores initials on the axes that report a state instead of a person", () => {
    const { container } = render(<Timeline axis="flow" items={[{ title: "Build", initials: "SK" }]} />);
    expect(container.querySelector(".td-mk-timeline-initials")).toBeNull();
  });

  it("keeps the flow axis on one line — a pipeline that wraps loses its order", () => {
    const css = read("timeline.css");
    const flow = css.slice(css.indexOf(".td-mk-timeline--flow {"));
    expect(flow).toContain("flex-direction: row");
    expect(flow).toContain("overflow-x: auto");
  });
});

/* ── Progress, and the compliance slot that collapsed into it ─────────── */

describe("Progress with a verdict", () => {
  it("replaces the percentage with the status rather than showing both", () => {
    render(<Progress label="Triennial re-evaluation" value={78} status={<Badge variant="success">On track</Badge>} />);
    expect(screen.getByText("On track")).toBeInTheDocument();
    // Two readings of the same bar in the same corner is one too many.
    expect(screen.queryByText("78%")).toBeNull();
  });

  it("still reports the real number to assistive tech when a badge covers it", () => {
    render(<Progress label="PWN" value={95} status={<Badge>Today</Badge>} />);
    expect(screen.getByRole("progressbar", { name: "PWN" })).toHaveAttribute("aria-valuenow", "95");
  });
});

/* ── ReadingProgress ──────────────────────────────────────────────────── */

describe("ReadingProgress", () => {
  it("names itself, and reports a page with nothing to scroll as read", () => {
    render(<ReadingProgress />);
    const bar = screen.getByRole("progressbar", { name: "Reading progress" });
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    // A piece shorter than the viewport is not one you have read none of.
    expect(bar).toHaveAttribute("aria-valuenow", "100");
  });

  it("starts at zero once there is something to scroll", () => {
    // jsdom reports every element as zero-sized, so the scrollable case has to
    // be described to it rather than laid out.
    const height = vi.spyOn(document.documentElement, "scrollHeight", "get").mockReturnValue(4000);
    render(<ReadingProgress />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    height.mockRestore();
  });

  it("says so rather than reporting a confident zero when the target is missing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<ReadingProgress target="#not-here" />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("#not-here"));
    warn.mockRestore();
  });

  it("does not eat clicks on whatever the site puts in the top of the page", () => {
    expect(read("reading-progress.css")).toContain("pointer-events: none");
  });

  it("keeps Progress server-renderable by living in its own module", () => {
    // The whole reason this is not `Progress variant="reading"`.
    expect(read("reading-progress.tsx")).toContain('"use client"');
    expect(read("progress.tsx")).not.toContain('"use client"');
  });
});

/* ── Counter ──────────────────────────────────────────────────────────── */

describe("Counter", () => {
  it("shows the whole number where it cannot animate, rather than a blank", () => {
    // No IntersectionObserver and no matchMedia here, which is also the shape
    // of a stale browser: the fallback has to be the fact, not an empty stat.
    render(<Counter value={23} label="Engagements" />);
    expect(screen.getByText("Engagements")).toBeInTheDocument();
    expect(screen.getByText("23")).toBeInTheDocument();
  });

  it("holds the decimals it was asked for", () => {
    render(<Counter value={4.5} precision={1} label="Handoff score" />);
    expect(screen.getByText("4.5")).toBeInTheDocument();
  });

  it("keeps the suffix out of the counted number", () => {
    const { container } = render(<Counter value={98} label="Retention" suffix="%" />);
    // Animating "98" up to "98%" would run the percent sign through the digits,
    // so the unit is a sibling of the value rather than part of it.
    expect(container.querySelector(".td-react-counter-suffix")).toHaveTextContent("%");
    expect(container.querySelector(".td-react-counter-value")?.firstChild?.textContent).toBe("98");
  });

  it("holds the digits at one width so the label cannot jitter under them", () => {
    expect(read("counter.css")).toContain("font-variant-numeric: tabular-nums");
  });

  it("keeps KpiCard server-renderable by living in its own module", () => {
    expect(read("counter.tsx")).toContain('"use client"');
    expect(read("kpi-card.tsx")).not.toContain('"use client"');
  });
});

/* ── Testimonial ──────────────────────────────────────────────────────── */

describe("Testimonial", () => {
  it("marks the quote up as a quotation with its attribution", () => {
    const { container } = render(
      <Testimonial name="Rajesh Sharma" role="CTO · Rajesh & Co" initials="RS">They owned the deploy.</Testimonial>,
    );
    expect(container.querySelector("figure blockquote")).toHaveTextContent("They owned the deploy.");
    expect(container.querySelector("figcaption")).toHaveTextContent("Rajesh Sharma");
  });

  it("passes a citation through to the blockquote", () => {
    const { container } = render(<Testimonial name="A" source="https://example.test/case">Good.</Testimonial>);
    expect(container.querySelector("blockquote")).toHaveAttribute("cite", "https://example.test/case");
  });

  it("draws the quote mark rather than putting one in the text", () => {
    const { container } = render(<Testimonial name="A">Good.</Testimonial>);
    // A typed quote mark would be read aloud, and would double up with the
    // caller's own punctuation.
    expect(container.textContent).not.toContain("“");
    expect(read("testimonial.css")).toContain('content: "\\201C"');
  });

  it("prefers a supplied avatar over initials", () => {
    const { container } = render(<Testimonial name="A" initials="RS" avatar={<img alt="" src="/a.png" />}>Good.</Testimonial>);
    expect(container.querySelector("img")).toBeInTheDocument();
    expect(container.querySelector(".td-react-testimonial-avatar")).toBeNull();
  });
});

/* ── Terminal ─────────────────────────────────────────────────────────── */

describe("Terminal", () => {
  it("sets each line by what it is", () => {
    const { container } = render(
      <Terminal
        title="deploy"
        lines={[
          { kind: "command", text: "docker compose up -d" },
          { kind: "dim", text: "Running 4/4" },
          { kind: "ok", text: "Deploy complete" },
        ]}
      />,
    );
    const kinds = [...container.querySelectorAll(".td-react-terminal-line")].map(line => line.getAttribute("data-kind"));
    expect(kinds).toEqual(["command", "dim", "ok"]);
  });

  it("puts a prompt only on the lines that were typed", () => {
    const { container } = render(<Terminal lines={[{ kind: "command", text: "ls" }, { kind: "output", text: "a  b" }]} />);
    expect(container.querySelectorAll(".td-react-terminal-prompt")).toHaveLength(1);
  });

  it("offers no copy control — a transcript is read, not run", () => {
    render(<Terminal lines={[{ text: "hi" }]} />);
    expect(screen.queryByRole("button", { name: /copy/i })).toBeNull();
  });

  it("lets the keyboard reach the scroller", () => {
    render(<Terminal label="Build log" lines={[{ text: "hi" }]} />);
    expect(screen.getByRole("region", { name: "Build log" })).toHaveAttribute("tabindex", "0");
  });
});

/* ── CodeBlock's diff mode — the before/after slot ────────────────────── */

describe("CodeBlock in diff mode", () => {
  const DIFF = ["--- a/x.ts", "+++ b/x.ts", " const a = 1;", "-const b = 2;", "+const b = 3;"].join("\n");

  it("marks each line by its first character", () => {
    const { container } = render(<CodeBlock diff code={DIFF} />);
    const kinds = [...container.querySelectorAll(".td-react-diff-line")].map(line => line.getAttribute("data-kind"));
    expect(kinds).toEqual(["meta", "meta", "context", "del", "add"]);
  });

  it("reads +++ and --- as file headers, not as an added and a removed line", () => {
    const { container } = render(<CodeBlock diff code={"+++ b/x.ts\n+real"} />);
    const kinds = [...container.querySelectorAll(".td-react-diff-line")].map(line => line.getAttribute("data-kind"));
    expect(kinds).toEqual(["meta", "add"]);
  });

  it("does not invent a blank line from a trailing newline", () => {
    const { container } = render(<CodeBlock diff code={"+one\n"} />);
    expect(container.querySelectorAll(".td-react-diff-line")).toHaveLength(1);
  });

  it("keeps the markers in the text, so what is copied is still a diff", () => {
    const { container } = render(<CodeBlock diff code={DIFF} />);
    expect(container.querySelector("code")?.textContent).toContain("-const b = 2;");
  });

  it("carries the change as ink and a rail, never as a wash of colour", () => {
    const css = read("code-block.css");
    const diff = css.slice(css.indexOf(".td-react-diff-line {"));
    // Colour is category; a hovering green fill inside a recess is the one move
    // the system forbids.
    expect(diff).not.toMatch(/background:\s*color-mix/);
    expect(diff).toContain("box-shadow: inset 2px 0 0");
  });
});

/* ── Tooltip's peek variant ───────────────────────────────────────────── */

describe("Tooltip as a peek", () => {
  it("keeps the tooltip contract — described-by, not a second focus stop", () => {
    render(<Tooltip variant="peek" content={<span>₹2,04,900 outstanding</span>}><button>INV-0231</button></Tooltip>);
    const trigger = screen.getByRole("button", { name: "INV-0231" });
    expect(trigger).toHaveAttribute("aria-describedby");
    expect(screen.getByRole("tooltip")).toHaveTextContent("₹2,04,900 outstanding");
  });

  it("is the same mechanism wearing a different class", () => {
    const { container: hint } = render(<Tooltip content="x"><button>a</button></Tooltip>);
    const { container: peek } = render(<Tooltip variant="peek" content="x"><button>b</button></Tooltip>);
    expect(hint.querySelector(".td-react-peek")).toBeNull();
    expect(peek.querySelector(".td-tooltip.td-react-peek")).toBeInTheDocument();
  });

  it("marks its reference so the reader knows something is there", () => {
    expect(read("tooltip.css")).toContain("text-decoration: underline dotted");
  });
});

/* ── SubNav, and the shell that now renders it ────────────────────────── */

const SECTIONS = [
  { label: "Workspace", items: [{ label: "General", href: "/general", count: 12 }, { label: "Billing", href: "/billing", current: true }] },
  { label: "Security", items: [{ label: "Secrets", href: "/secrets" }] },
];

describe("SubNav", () => {
  it("marks the current page for assistive tech rather than by colour alone", () => {
    render(<SubNav sections={SECTIONS} label="Settings" />);
    expect(screen.getByRole("link", { name: /Billing/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /General/ })).not.toHaveAttribute("aria-current");
  });

  it("hands the anchor to the router when asked", () => {
    render(<SubNav sections={SECTIONS} renderLink={({ className, href, children }) => <a className={className} href={href} data-router="yes">{children}</a>} />);
    expect(screen.getByRole("link", { name: /General/ })).toHaveAttribute("data-router", "yes");
  });

  it("drops its plate inside a shell, so chrome does not nest in chrome", () => {
    const { container: alone } = render(<SubNav sections={SECTIONS} />);
    const { container: inside } = render(<SubNav sections={SECTIONS} plate={false} />);
    expect(alone.querySelector(".td-react-subnav--plate")).toBeInTheDocument();
    expect(inside.querySelector(".td-react-subnav--plate")).toBeNull();
  });

  it("presses rather than tints, and says selected in papaya ink", () => {
    const css = read("sub-nav.css");
    const selected = css.slice(css.indexOf('.td-react-subnav-item[aria-current="page"]'));
    expect(selected).toContain("var(--td-row-selected)");
    expect(selected).toContain("color: var(--td-brand-text)");
    // Never an orange fill.
    expect(selected).not.toMatch(/background:\s*var\(--td-brand\)/);
  });
});

/* ── FilePreview ──────────────────────────────────────────────────────── */

describe("FilePreview", () => {
  it("shows the name and the facts, and offers the actions given to it", () => {
    render(<FilePreview name="SOW.pdf" meta="142 KB · 4 pages" actions={<button>Download</button>} />);
    expect(screen.getByText("SOW.pdf")).toBeInTheDocument();
    expect(screen.getByText("142 KB · 4 pages")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download" })).toBeInTheDocument();
  });

  it("draws a ruled page when there is no real thumbnail, and hides it from the reader", () => {
    const { container } = render(<FilePreview name="SOW.pdf" />);
    expect(container.querySelectorAll(".td-react-filepreview-rule")).toHaveLength(3);
    expect(container.querySelector(".td-react-filepreview-thumb")).toHaveAttribute("aria-hidden", "true");
  });

  it("stops hiding the thumbnail once it is a real one", () => {
    const { container } = render(<FilePreview name="SOW.pdf" thumbnail={<img alt="First page" src="/p1.png" />} />);
    expect(container.querySelector(".td-react-filepreview-thumb")).not.toHaveAttribute("aria-hidden");
  });

  it("houses the preview in a well and the chrome on the plate", () => {
    const css = read("file-preview.css");
    const thumb = css.slice(css.indexOf(".td-react-filepreview-thumb {"));
    expect(thumb).toContain("inset 2px 2px 5px");
  });
});

/* ── IsoStack ─────────────────────────────────────────────────────────── */

describe("IsoStack", () => {
  it("is a list of the cards it was given", () => {
    render(<IsoStack label="Engagements" cards={[{ title: "Commercely" }, { title: "Planely" }]} />);
    expect(screen.getByRole("list", { name: "Engagements" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("opens the deck on keyboard focus, not only on hover", () => {
    // Without this a buried card can be tabbed to but never seen.
    expect(read("iso-stack.css")).toContain(".td-react-isostack:focus-within");
  });

  it("renders a link only where one was given", () => {
    render(<IsoStack cards={[{ title: "Commercely", href: "/work" }, { title: "Planely" }]} />);
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });
});

/* ── MultiStep ────────────────────────────────────────────────────────── */

describe("MultiStep", () => {
  const STEPS_4 = [
    { label: "Discovery", title: "Scope the problem" },
    { label: "Scope", title: "Build a plan" },
    { label: "Build", title: "Ship in sprints" },
  ];

  it("shows where you are, in words and to assistive tech", () => {
    render(<MultiStep steps={STEPS_4} label="Engagement" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
    expect(screen.getByRole("heading", { name: "Scope the problem" })).toBeInTheDocument();
  });

  it("moves on Next and back on Back", async () => {
    const user = userEvent.setup();
    render(<MultiStep steps={STEPS_4} />);
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2");
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
  });

  it("cannot go back off the front", () => {
    render(<MultiStep steps={STEPS_4} />);
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
  });

  it("completes rather than advancing off the end", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<MultiStep steps={STEPS_4} defaultValue={2} onComplete={onComplete} />);
    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("lets the caller hold the position, so movement can be gated on validity", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<MultiStep steps={STEPS_4} value={0} onValueChange={onValueChange} />);
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(onValueChange).toHaveBeenCalledWith(1);
    // Controlled: it asked, and stayed where it was told.
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
  });

  it("carries the same three states the rest of the family does", () => {
    const { container } = render(<MultiStep steps={STEPS_4} defaultValue={1} />);
    const states = [...container.querySelectorAll(".td-react-multistep-segment")].map(s => s.getAttribute("data-state"));
    expect(states).toEqual(["done", "current", "upcoming"]);
  });

  it("names its steps for a screen reader even though the bar has no room", () => {
    const { container } = render(<MultiStep steps={STEPS_4} />);
    expect(container.querySelector(".td-react-multistep-vh")).toHaveTextContent("Discovery");
  });
});

/* ── ConfirmButton ────────────────────────────────────────────────────── */

describe("ConfirmButton", () => {
  it("asks before it acts", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ConfirmButton label="Delete build" onConfirm={onConfirm} />);
    await user.click(screen.getByRole("button", { name: "Delete build" }));
    expect(onConfirm).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Sure?" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("announces the label change, or a screen-reader user confirms blind", () => {
    render(<ConfirmButton label="Delete build" />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-live", "polite");
  });

  it("disarms on Escape", async () => {
    const user = userEvent.setup();
    render(<ConfirmButton label="Delete build" />);
    await user.click(screen.getByRole("button", { name: "Delete build" }));
    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Delete build" })).toBeInTheDocument();
  });

  it("disarms when focus leaves", async () => {
    const user = userEvent.setup();
    render(<><ConfirmButton label="Delete build" /><button>Elsewhere</button></>);
    await user.click(screen.getByRole("button", { name: "Delete build" }));
    await user.click(screen.getByRole("button", { name: "Elsewhere" }));
    expect(screen.getByRole("button", { name: "Delete build" })).toBeInTheDocument();
  });

  it("keeps Button server-renderable by living in its own module", () => {
    expect(read("confirm-button.tsx")).toContain('"use client"');
    expect(read("button.tsx")).not.toContain('"use client"');
  });
});

/* ── Spotlight ────────────────────────────────────────────────────────── */

const ACTIONS = [
  { id: "a", label: "Solutions", detail: "/solutions", group: "Pages" },
  { id: "b", label: "Commercely", detail: "/work/commercely", group: "Pages" },
  { id: "c", label: "Toggle theme", group: "Actions" },
];

describe("Spotlight", () => {
  it("renders nothing at all when closed", () => {
    const { container } = render(<Spotlight open={false} onOpenChange={() => {}} actions={ACTIONS} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("is a modal dialog holding a listbox", () => {
    render(<Spotlight open onOpenChange={() => {}} actions={ACTIONS} label="Search" />);
    expect(screen.getByRole("dialog", { name: "Search" })).toHaveAttribute("aria-modal", "true");
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("groups the rows in the order they arrive", () => {
    const { container } = render(<Spotlight open onOpenChange={() => {}} actions={ACTIONS} />);
    const labels = [...container.querySelectorAll(".td-react-spotlight-grouplabel")].map(l => l.textContent);
    expect(labels).toEqual(["Pages", "Actions"]);
  });

  it("moves the selection with the arrows and opens on Enter", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Spotlight open onOpenChange={() => {}} actions={ACTIONS} onSelect={onSelect} />);
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "b" }));
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Spotlight open onOpenChange={onOpenChange} actions={ACTIONS} />);
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does no matching of its own — ranking is the caller's judgement", async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    render(<Spotlight open onOpenChange={() => {}} actions={ACTIONS} query="" onQueryChange={onQueryChange} />);
    await user.type(screen.getByRole("combobox"), "co");
    expect(onQueryChange).toHaveBeenCalled();
    // Every row it was given is still on screen: it filtered nothing.
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("resets the cursor when the results change, so Enter cannot fire the wrong row", () => {
    const { rerender } = render(<Spotlight open onOpenChange={() => {}} actions={ACTIONS} />);
    rerender(<Spotlight open onOpenChange={() => {}} actions={[ACTIONS[2]]} />);
    expect(screen.getByRole("option", { name: /Toggle theme/ })).toHaveAttribute("aria-selected", "true");
  });

  it("says so when there is nothing to show", () => {
    render(<Spotlight open onOpenChange={() => {}} actions={[]} empty="No matches." />);
    expect(screen.getByText("No matches.")).toBeInTheDocument();
  });
});

/* ── SearchBar, and the handler it used to swallow ────────────────────── */

describe("SearchBar key handling", () => {
  it("calls the caller's onKeyDown, rather than replacing it", async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    render(<SearchBar aria-label="Search" onKeyDown={onKeyDown} />);
    await user.click(screen.getByRole("searchbox"));
    await user.keyboard("{ArrowDown}");
    // `{...props}` is spread onto the input and the component's own handler is
    // bound after it, so without the call-through the field looks wired and the
    // arrows do nothing.
    expect(onKeyDown).toHaveBeenCalled();
  });

  it("stands down on a key the caller has already handled", async () => {
    const user = userEvent.setup();
    const onSuggestionSelect = vi.fn();
    render(
      <SearchBar
        aria-label="Search"
        suggestions={[{ id: "a", label: "Alpha" }]}
        onSuggestionSelect={onSuggestionSelect}
        onKeyDown={event => event.preventDefault()}
      />,
    );
    await user.click(screen.getByRole("combobox"));
    await user.keyboard("{ArrowDown}{Enter}");
    // The caller took the arrows, so the component's own list never moved and
    // Enter had nothing selected to pick.
    expect(onSuggestionSelect).not.toHaveBeenCalled();
  });

  it("still drives its own suggestions when the caller does not interfere", async () => {
    const user = userEvent.setup();
    const onSuggestionSelect = vi.fn();
    render(<SearchBar aria-label="Search" suggestions={[{ id: "a", label: "Alpha" }]} onSuggestionSelect={onSuggestionSelect} />);
    await user.click(screen.getByRole("combobox"));
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onSuggestionSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "a" }));
  });
});
