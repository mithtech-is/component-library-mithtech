import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

const SRC = dirname(fileURLToPath(import.meta.url));
import axe from "axe-core";
import { ArticleCard, ArticleCardGrid, Button, Card, CaseCard, ThemeToggle, CaseCardGrid, ComparisonTable, CtaBanner, FeatureCard, FeatureGrid, LinkCells, Prose, RectTitle, splitRectTitle, Timeline, type ArticleCardAsset } from "./index";

/** Manoj's own card: two live tools, two files, a dataset and a checklist. */
const PAYLOAD: ArticleCardAsset[] = [
  { kind: "live", label: "Cost calculator", href: "#calculator", meta: "live" },
  { kind: "download", label: "Line-item sheet", href: "/line-items.xlsx", meta: "xlsx \u00b7 84 kb", download: true },
  { kind: "data", label: "11-engagement dataset", href: "/engagements.csv", meta: "csv", download: true },
  { kind: "interactive", label: "Scoping checklist", href: "#checklist" },
];

const COLUMNS = [
  { key: "us", label: "Mithtech", note: "Open source", highlight: true },
  { key: "them", label: "Proprietary SaaS" },
];
const ROWS = [
  { label: "Source access", cells: { us: true, them: false } },
  { label: "Per-seat licence", note: "Charged annually", cells: { us: "None", them: "₹2,400" } },
  { label: "Exit path", cells: { us: "Your database", them: undefined } },
];

describe("marketing components", () => {
  it("names a linked article card by its title, not by everything on the card", () => {
    render(
      <ArticleCardGrid aria-label="Latest posts">
        <ArticleCard
          href="/blog/erpnext-cutover"
          eyebrow="Field notes"
          title="Cutting over ERPNext without a freeze"
          excerpt="Two plants, one Saturday, a live migration and a rollback plan."
          date="12 Feb 2026"
          readTime="6 min"
          author={{ name: "Manoj Bhat", initials: "MB" }}
        />
      </ArticleCardGrid>,
    );
    const link = screen.getByRole("link", { name: "Cutting over ERPNext without a freeze" });
    expect(link).toHaveAttribute("href", "/blog/erpnext-cutover");
    expect(screen.getByRole("article")).toHaveClass("td-mk-article--link");
    expect(screen.getByLabelText("Latest posts")).toHaveClass("td-mk-article-grid");
    expect(screen.getByText("MB")).toHaveClass("td-mk-article-avatar");
    // The whole card cannot be a link element (payload would be link-in-link);
    // the stretched pseudo-element is what makes it act like one.
    expect(link.tagName).toBe("A");
  });

  it("omits the author + meta foot when neither is provided", () => {
    render(<ArticleCard title="Draft post" excerpt="No metadata yet." />);
    expect(document.querySelector(".td-mk-article-foot")).toBeNull();
  });

  it("renders the article card without a link as plain text, no anchor", () => {
    render(<ArticleCard title="Placeholder" excerpt="Nowhere to go." />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByRole("article")).not.toHaveClass("td-mk-article--link");
  });

  it("surfaces what the piece carries in a labelled \u201cIn this piece\u201d well", () => {
    // The whole section shipped missing: a card with assets rendered the
    // excerpt straight into the author row, so a reader could not tell a piece
    // with a calculator and a dataset in it from one with nothing.
    render(
      <ArticleCard
        href="/blog/erpnext-implementation-cost"
        title="What an ERPNext implementation actually costs in India"
        excerpt="Eleven engagements."
        assets={PAYLOAD}
      />,
    );
    // The well is a labelled group holding up to three rows that scroll
    // sideways as one — the shape the design system's own card has. Rows are
    // real elements rather than a wrapping column, because a `flex-wrap`
    // column gives every chip in a column the widest chip's width and short
    // labels then trail a gap.
    const well = screen.getByRole("group", { name: "In this piece" });
    expect(well).toHaveClass("td-mk-article-assets");
    expect(within(well).getAllByRole("listitem")).toHaveLength(PAYLOAD.length);
    const rows = well.querySelectorAll(".td-mk-article-assetrow");
    expect(rows.length).toBeLessThanOrEqual(3);
    // Four assets over three rows: 2 + 2, in order, never an empty row.
    expect(Array.from(rows, row => row.children.length)).toEqual([2, 2]);
    expect(Array.from(rows).every(row => row.children.length > 0)).toBe(true);

    const sheet = screen.getByRole("link", { name: /Line-item sheet/ });
    expect(sheet).toHaveClass("td-mk-article-asset");
    // The kind is what colours the glyph and picks it — a chip without it is
    // an uncategorised pill.
    expect(sheet).toHaveAttribute("data-kind", "download");
    expect(sheet).toHaveAttribute("download");
    // A format and a size are machine values, so they are set in mono.
    expect(within(sheet).getByText("xlsx \u00b7 84 kb")).toHaveClass("td-mk-article-asset-meta");

    // Each kind reaches its own glyph, so the four are told apart before they
    // are read.
    const kinds = screen.getAllByRole("link").slice(1).map(link => link.getAttribute("data-kind"));
    expect(kinds).toEqual(["live", "download", "data", "interactive"]);
    expect(document.querySelectorAll(".td-mk-article-asset-glyph")).toHaveLength(PAYLOAD.length);

    // The well sits between the excerpt and the author row, above the
    // stretched title link rather than under it.
    const body = document.querySelector(".td-mk-article-body")!;
    const order = Array.from(body.children).map(child => child.className);
    expect(order.indexOf("td-mk-article-payload")).toBeGreaterThan(order.indexOf("td-mk-article-excerpt"));
  });

  it("names the well whatever the piece calls it, and omits it when nothing is carried", () => {
    const { rerender } = render(<ArticleCard title="Field note" assets={PAYLOAD} assetsLabel="What ships with this" />);
    expect(screen.getByRole("group", { name: "What ships with this" })).toBeInTheDocument();
    rerender(<ArticleCard title="Field note" />);
    expect(document.querySelector(".td-mk-article-payload")).toBeNull();
  });

  it("gives a chip a press deeper than its hover, and holds the kind colour through both", () => {
    // Rest, hover and press are one ladder: same five slots in the same order,
    // and the press has to go further in or the two top rungs read the same.
    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "article-card.css"), "utf8");
    const inset = (selector: string) => {
      const body = new RegExp(`\\${selector}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? "";
      const shadow = /box-shadow:([^;]*);/.exec(body)?.[1] ?? "";
      return [...shadow.matchAll(/inset ([\d.]+)px/g)].map(match => Number(match[1]));
    };
    const hover = inset(".td-mk-article-asset:hover");
    const press = inset(".td-mk-article-asset:active");
    expect(hover.length).toBeGreaterThan(0);
    expect(Math.max(...press)).toBeGreaterThan(Math.max(...hover));
    // Colour is category: the glyph's ink is the kind's, and it never moves
    // with state — only the label's ink and the depth do.
    expect(css).toMatch(/\.td-mk-article-asset-glyph\s*\{[^}]*color:\s*var\(--td-mk-asset-ink\)/);
    expect(css).not.toMatch(/\.td-mk-article-asset:hover \.td-mk-article-asset-glyph/);
    for (const kind of ["live", "download", "data", "interactive"]) {
      expect(css).toContain(`.td-mk-article-asset[data-kind="${kind}"]`);
    }
  });

  it("names a linked case card by its title, not by everything on the card", () => {
    render(
      <CaseCard
        href="/case-studies/rework"
        eyebrow="Manufacturing"
        title="Order-to-cash cut to four days"
        summary="A 90-plant rollout on ERPNext."
        metrics={[{ label: "Order-to-cash", value: "-38%" }, { label: "Plants live", value: "90" }]}
      />,
    );
    const link = screen.getByRole("link", { name: "Order-to-cash cut to four days" });
    expect(link).toHaveAttribute("href", "/case-studies/rework");
    expect(screen.getByRole("article")).toHaveClass("td-mk-case--link");
  });

  it("pairs each case metric label with its value as a description list", () => {
    render(<CaseCard title="Rollout" metrics={[{ label: "Plants live", value: "90" }]} />);
    expect(screen.getByRole("term")).toHaveTextContent("Plants live");
    expect(screen.getByRole("definition")).toHaveTextContent("90");
  });

  it("omits the call to action on a case card with nowhere to go", () => {
    render(<CaseCard title="Rollout" summary="No link." />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByRole("article")).not.toHaveClass("td-mk-case--link");
  });

  it("carries feature tone on the class, and keeps grid density explicit", () => {
    render(
      <FeatureGrid columns={4} aria-label="Capabilities">
        <FeatureCard tone="accent" title="Automation" points={["n8n flows", "Webhooks"]}>Wire the systems together.</FeatureCard>
      </FeatureGrid>,
    );
    expect(screen.getByLabelText("Capabilities")).toHaveClass("td-mk-feature-grid--4");
    expect(screen.getByRole("article")).toHaveClass("td-mk-feature--accent");
    expect(within(screen.getByRole("list")).getAllByRole("listitem")).toHaveLength(2);
  });

  /*
   * `columns` is a COUNT, and this is the test that makes that true.
   *
   * It used to be a min-width hint: `columns={3}` set
   * `minmax(min(100%, 260px), 1fr)` under `auto-fit`, which lays down FOUR
   * tracks at a 1216px measure. A variant name is a promise about what appears
   * on screen, and getting a clean 3 x 2 out of six cards meant narrowing the
   * container to 960px — so the container, not the prop, decided the count.
   *
   * jsdom performs no layout, so the count is checked the only honest way
   * available here: the track expression is read out of the stylesheet and its
   * arithmetic evaluated at a real measure. Both halves matter — the shape,
   * so the formula cannot be swapped for a hint again, and the numbers, so the
   * floors chosen actually let `n` tracks fit at the page's width.
   */
  const gridRule = (css: string, selector: string) => {
    const body = new RegExp(`${selector.replace(/[.[\]]/g, "\\$&")}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? "";
    return body.replace(/\s+/g, " ");
  };
  /** The count `auto-fit` lays down for a track floor and a cap, at `width`. */
  const tracks = (width: number, floor: number, n: number, gap: number) => {
    // The expression in the stylesheet, evaluated: a track is the wider of the
    // floor and one of `n` equal columns.
    const track = Math.max(floor, (width - (n - 1) * gap) / n);
    return Math.max(1, Math.min(n, Math.floor((width + gap) / (track + gap))));
  };

  it("draws the number of columns it is asked for, and still reflows below the floor", () => {
    const css = readFileSync(join(SRC, "feature-card.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    const base = gridRule(css, ".td-mk-feature-grid");
    // The cap is the whole fix: `max(floor, one of n equal tracks)`.
    expect(base).toMatch(/repeat\(auto-fit, minmax\(min\(100%, max\(var\(--td-grid-min\), calc\(\(100% - \(var\(--td-grid-n\) - 1\) \* var\(--td-grid-gap\)\) \/ var\(--td-grid-n\)\)\)\), 1fr\)\)/);
    // The gap is read from one variable in both places, so the arithmetic and
    // the actual gutter cannot drift apart.
    expect(base).toMatch(/gap: var\(--td-grid-gap\)/);

    const FLOORS: Record<number, number> = { 2: 300, 3: 260, 4: 216 };
    const GAP = 22;
    for (const n of [2, 3, 4]) {
      expect(gridRule(css, `.td-mk-feature-grid--${n}`), `columns=${n}`)
        .toMatch(new RegExp(`--td-grid-n: ${n};\\s*--td-grid-min: ${FLOORS[n]}px`));
      // The homepage's own measure, at the 22px `--td-sp-10` resolves to.
      expect(tracks(1216, FLOORS[n], n, GAP), `columns=${n} at 1216`).toBe(n);
      // And it still gives way rather than squashing: at a tablet measure a
      // four-column grid is not four columns of 216px it has no room for.
      expect(tracks(700, FLOORS[4], 4, GAP), "columns=4 at 700").toBeLessThan(4);
    }
    // The defect itself, stated as arithmetic: an uncapped 260px floor at 1216
    // fits four tracks, which is what `columns={3}` used to draw.
    expect(Math.floor((1216 + GAP) / (260 + GAP))).toBe(4);
  });

  it("gives LinkCells the same column count, and leaves it uncapped when unasked", () => {
    // Six cells broke 5 + 1 at the page measure and orphaned the sixth, which
    // is how a set of onward links lost the job to FeatureGrid.
    const { container, rerender } = render(<LinkCells items={[{ href: "/a", title: "One" }]} />);
    const nav = () => container.firstElementChild as HTMLElement;
    expect(nav().className).not.toMatch(/td-react-linkcells--/);

    rerender(<LinkCells columns={3} items={[{ href: "/a", title: "One" }]} />);
    expect(nav()).toHaveClass("td-react-linkcells--3");

    rerender(<LinkCells columns={3} min={200} items={[{ href: "/a", title: "One" }]} />);
    expect(nav().style.getPropertyValue("--td-grid-min")).toBe("200px");

    const css = readFileSync(join(SRC, "link-cells.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    // The same expression as FeatureGrid's, because the two must not diverge.
    expect(css).toMatch(/minmax\(min\(100%, max\(var\(--td-grid-min\), calc\(\(100% - \(var\(--td-grid-n\) - 1\) \* var\(--td-grid-gap\)\) \/ var\(--td-grid-n\)\)\)\), 1fr\)/);
  });

  it("takes a reflow floor separately from the count", () => {
    // The half of the old `columns` that was doing real work, under its own
    // name — so a caller can ask for three columns AND say how narrow one may
    // get, which the single prop could never express.
    const { container } = render(<FeatureGrid columns={3} min={200} />);
    const grid = container.firstElementChild as HTMLElement;
    expect(grid).toHaveClass("td-mk-feature-grid--3");
    expect(grid.style.getPropertyValue("--td-grid-min")).toBe("200px");

    // Omitted, the class's own default stands rather than an inline override.
    const { container: plain } = render(<FeatureGrid columns={3} />);
    expect((plain.firstElementChild as HTMLElement).style.getPropertyValue("--td-grid-min")).toBe("");
  });

  it("routes every card's link through renderLink when one is supplied", () => {
    // On a Next.js site each of these was a full document load: the three
    // cards took an `href` and rendered a plain `<a>`, while LinkCells,
    // DataList, IsoStack, LogoStrip and SocialButton beside them all took
    // `renderLink`. The recent-work grid, the six doors, the two platforms and
    // the four engineering notes were the whole homepage.
    const seen: { className: string; href: string }[] = [];
    const renderLink = ({ className, href, children }: { className: string; href: string; children: ReactNode }) => {
      seen.push({ className, href });
      return <a className={className} href={href} data-router="next">{children}</a>;
    };
    render(
      <>
        <CaseCard title="Rollout" href="/work/rollout" renderLink={renderLink} />
        <ArticleCard title="Field note" href="/notes/field" renderLink={renderLink} />
        <FeatureCard title="Automation" href="/services/automation" renderLink={renderLink}>Copy.</FeatureCard>
      </>,
    );
    expect(seen.map(call => call.href)).toEqual(["/work/rollout", "/notes/field", "/services/automation"]);
    // The card keeps ownership of the class; the caller only owns the element.
    expect(seen.map(call => call.className)).toEqual([
      "td-mk-case-titlelink", "td-mk-article-titlelink", "td-mk-feature-titlelink",
    ]);
    for (const link of screen.getAllByRole("link")) expect(link).toHaveAttribute("data-router", "next");
  });

  it("leaves the plain anchor in place when no renderLink is given", () => {
    render(<CaseCard title="Rollout" href="/work/rollout" />);
    const link = screen.getByRole("link", { name: "Rollout" });
    expect(link.tagName).toBe("A");
    expect(link).toHaveClass("td-mk-case-titlelink");
  });

  it("leaves an article's asset chips alone — a download is not a route", () => {
    // `renderLink` covers the card's own link and says so. A chip's colour
    // rides `data-kind`, which the shared signature has nowhere to put, and
    // most chips are downloads: routing one asks for a page that does not
    // exist instead of saving a file.
    const { container } = render(
      <ArticleCard
        title="Field note"
        href="/notes/field"
        assets={PAYLOAD}
        renderLink={({ className, href, children }) => <a className={className} href={href} data-router="next">{children}</a>}
      />,
    );
    for (const chip of container.querySelectorAll(".td-mk-article-asset")) {
      expect(chip).not.toHaveAttribute("data-router");
      expect(chip).toHaveAttribute("data-kind");
    }
  });

  it("renders boolean comparison cells as marks with a text equivalent", () => {
    render(<ComparisonTable caption="Open source against proprietary SaaS" columns={COLUMNS} rows={ROWS} />);
    const rowHeader = screen.getByRole("rowheader", { name: "Source access" });
    const cells = within(rowHeader.closest("tr") as HTMLElement).getAllByRole("cell");
    expect(cells[0]).toHaveTextContent("Yes");
    expect(cells[1]).toHaveTextContent("No");
  });

  it("draws a different glyph for a false comparison cell, so the mark is not colour alone", () => {
    render(<ComparisonTable caption="Open source against proprietary SaaS" columns={COLUMNS} rows={ROWS} />);
    const rowHeader = screen.getByRole("rowheader", { name: "Source access" });
    const cells = within(rowHeader.closest("tr") as HTMLElement).getAllByRole("cell");
    const glyph = (cell: HTMLElement) => cell.querySelector("svg path")?.getAttribute("d");
    expect(glyph(cells[0])).toBeTruthy();
    expect(glyph(cells[1])).toBeTruthy();
    expect(glyph(cells[0])).not.toEqual(glyph(cells[1]));
  });

  it("marks the argued-for comparison column as current on every row it crosses", () => {
    render(<ComparisonTable caption="Comparison" columns={COLUMNS} rows={ROWS} />);
    expect(screen.getByRole("columnheader", { name: /Mithtech/ })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("columnheader", { name: "Proprietary SaaS" })).not.toHaveAttribute("aria-current");
    expect(document.querySelectorAll(".td-mk-compare-cell--selected")).toHaveLength(ROWS.length);
  });

  it("leaves a comparison cell with no value legible as an em dash", () => {
    render(<ComparisonTable caption="Comparison" columns={COLUMNS} rows={ROWS} />);
    expect(screen.getByText("—")).toHaveClass("td-mk-compare-empty");
  });

  it("keeps the comparison table reachable by keyboard when it scrolls", () => {
    render(<ComparisonTable caption="Comparison" columns={COLUMNS} rows={ROWS} />);
    const region = screen.getByRole("region", { name: "Comparison" });
    expect(region).toHaveAttribute("tabindex", "0");
  });

  it("names the CTA banner region by its own title", () => {
    render(<CtaBanner eyebrow="Next step" title="Book a discovery call" description="Thirty minutes." actions={<Button>Book</Button>} assurance="A consultant reads it." />);
    expect(screen.getByRole("region", { name: "Book a discovery call" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Book" })).toBeInTheDocument();
  });

  it("exposes timeline state on the item and announces the current phase in text", () => {
    render(
      <Timeline
        label="Rollout phases"
        items={[
          { title: "Discovery", time: "Week 1", state: "done" },
          { title: "Build", time: "Week 2-6", state: "current" },
          { title: "Handover", time: "Week 7" },
        ]}
      />,
    );
    const items = within(screen.getByRole("list", { name: "Rollout phases" })).getAllByRole("listitem");
    expect(items[0]).toHaveAttribute("data-state", "done");
    expect(items[1]).toHaveAttribute("data-state", "current");
    expect(items[2]).toHaveAttribute("data-state", "upcoming");
    expect(items[1]).toHaveTextContent("Current phase");
  });

  it("passes prose through untouched so authored HTML keeps its semantics", () => {
    render(<Prose size="lg" framed><h2>Terms</h2><p>Body copy.</p></Prose>);
    expect(screen.getByRole("heading", { level: 2, name: "Terms" })).toBeInTheDocument();
    const root = screen.getByRole("heading", { level: 2 }).parentElement as HTMLElement;
    expect(root).toHaveClass("td-mk-prose", "td-mk-prose--lg", "td-mk-prose--framed");
  });

  it("sets a rectangle title in the display face, not the inherited UI face", () => {
    render(<RectTitle text="Talk to a principal consultant." />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveClass("td-h1", "td-react-rect-title");
    // `audit-fonts` fails a rectangle title that does not declare its face, and
    // the h1-h3 ramp is the only place the display face is inherited from.
    const lines = heading.querySelectorAll(".td-h1-line");
    expect(lines.length).toBeGreaterThan(1);
    // Splitting the headline must not reach the accessible name: the lines are
    // block boxes with no whitespace of their own, so without a separator this
    // announces — and copies — as "Talk to aprincipal consultant."
    expect(screen.getByRole("heading", { level: 1, name: "Talk to a principal consultant." })).toBe(heading);
  });

  it("runs the rectangle title at h2 and h3, which is the range the ramp covers", () => {
    render(<><RectTitle level={2} text="Second level headline here" /><RectTitle level={3} text="Third level headline here" /></>);
    expect(screen.getByRole("heading", { level: 2 })).toHaveClass("td-h2", "td-react-rect-title");
    expect(screen.getByRole("heading", { level: 3 })).toHaveClass("td-h3", "td-react-rect-title");
  });

  it("lands the last line in the brand colour, and drops it when asked", () => {
    const { rerender } = render(<RectTitle text="Order to cash in four days" />);
    const accented = screen.getByRole("heading", { level: 1 }).querySelectorAll(".td-h1-line");
    expect(accented[accented.length - 1]).toHaveClass("accent");
    expect(accented[0]).not.toHaveClass("accent");
    rerender(<RectTitle text="Order to cash in four days" accent={false} />);
    expect(screen.getByRole("heading", { level: 1 }).querySelectorAll(".accent")).toHaveLength(0);
  });

  /** The homepage h1: three locked lines, the third in the brand tone. */
  const HOME = ["One operating system.", "Every stakeholder.", "Engineered to run."];

  it("takes an explicit break set and does not re-break it", () => {
    // The fitter chooses balanced breaks, and for this headline the breaks ARE
    // the design — a balanced split of the same words is a different headline.
    // `text: string` had nowhere to put them.
    render(<RectTitle lines={HOME} tones={["ink", "ink", "brand"]} />);
    const heading = screen.getByRole("heading", { level: 1 });
    const lines = [...heading.querySelectorAll(".td-h1-line")];
    expect(lines).toHaveLength(3);
    expect(lines.map(line => line.textContent)).toEqual(HOME);
    // `tones` already covered the third-line accent, and still does.
    expect(lines[2]).toHaveClass("accent");
    // The whole headline is still one accessible name, with the separators.
    expect(heading).toHaveAccessibleName(HOME.join(" "));
  });

  it("still takes a number of lines, which is the other thing `lines` means", () => {
    render(<RectTitle text="Nine plants moved onto one ERPNext instance in eleven weeks" lines={2} />);
    expect(screen.getByRole("heading", { level: 1 }).querySelectorAll(".td-h1-line")).toHaveLength(2);
  });

  it("carries a screen-reader suffix inside the heading, out of every measured line", () => {
    // The homepage h1 carries the positioning and the geo for search while the
    // iconic three-line headline stays pixel-identical. Dropping it is an SEO
    // regression, and `text: string` had nowhere to put it either.
    const SUFFIX = "— Enterprise systems engineering, ERPNext implementation, and integration practice · Bengaluru, India · global delivery";
    render(<RectTitle lines={HOME} srSuffix={SUFFIX} />);
    const heading = screen.getByRole("heading", { level: 1 });

    // Inside the heading, so it is part of the heading's own text and name.
    const suffix = heading.querySelector(".td-react-rect-title-sr")!;
    expect(suffix).not.toBeNull();
    expect(suffix).toHaveTextContent(SUFFIX);
    expect(heading).toHaveAccessibleName(new RegExp("global delivery$"));

    // And NOT part of any measured line — the fitter reads `.td-h1-line`, so a
    // suffix that landed in one would stretch the rectangle to fit a sentence
    // nobody can see.
    expect(suffix.closest(".td-h1-line")).toBeNull();
    const lines = [...heading.querySelectorAll(".td-h1-line")];
    expect(lines.map(line => line.textContent)).toEqual(HOME);
    expect(lines.some(line => line.contains(suffix))).toBe(false);
  });

  it("hides the suffix from sight without hiding it from a screen reader", () => {
    for (const css of [readFileSync(join(SRC, "rect-title.css"), "utf8"),
                       readFileSync(join(SRC, "../../../registry/tonaldepth/rect-title.css"), "utf8")]) {
      const body = /-rect-title-sr \{([^}]*)\}/.exec(css)![1];
      // `display: none` would take it out of the accessibility tree too, which
      // is the one thing it must not do.
      expect(body).not.toMatch(/display:\s*none/);
      expect(body).toMatch(/clip-path:\s*inset\(50%\)/);
      expect(body).toMatch(/position:\s*absolute/);
    }
  });

  it("warns rather than rendering an empty heading when it is given no words", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<RectTitle />);
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it("never emits one line for a multi-word headline, because the fitter needs two to square off", () => {
    // A single `.td-h1-line` is nowrap with nothing to equalise against, so a
    // headline wider than the column would simply run off the side of the page.
    expect(splitRectTitle("Two words")).toHaveLength(2);
    expect(splitRectTitle("Talk to a principal consultant.")).toHaveLength(2);
    expect(splitRectTitle("Nine plants moved onto one ERPNext instance in eleven weeks")).toHaveLength(3);
    expect(splitRectTitle("Nine plants moved onto one ERPNext instance", 2)).toHaveLength(2);
    expect(splitRectTitle("Implementation")).toEqual(["Implementation"]);
    expect(splitRectTitle("   ")).toEqual([]);
  });

  it("breaks a headline at its most even point, not wherever a greedy fill lands", () => {
    // Filling to a target overshoots on the last word each line accepts, which
    // gave "Talk to a" / "principal consultant." — 9 against 21. The fitter caps
    // its scaling at 1.5x, so a gap that wide never closes and the block reads
    // as a ragged heading rather than the rectangle it is named for.
    expect(splitRectTitle("Talk to a principal consultant.")).toEqual(["Talk to a principal", "consultant."]);
    expect(splitRectTitle("What an implementation actually covers")).toEqual(["What an implementation", "actually covers"]);
    // The longest line is what the others have to reach, so it is what gets
    // minimised — never a split whose longest line could have been shorter.
    for (const headline of [
      "Order to cash, cut to four days",
      "Nine plants moved onto one ERPNext instance in eleven weeks",
      "Talk to a principal consultant.",
    ]) {
      const lines = splitRectTitle(headline);
      const longest = Math.max(...lines.map(line => line.length));
      const shortest = Math.min(...lines.map(line => line.length));
      expect(longest / shortest).toBeLessThan(2);
    }
  });

  it("keeps every button variant addressable at the specificity a consumer stylesheet can reach", () => {
    render(<><Button variant="ghost" size="lg">Ghost</Button><Button variant="filled">Filled</Button></>);
    const ghost = screen.getByRole("button", { name: "Ghost" });
    expect(ghost).toHaveClass("td-react-button", "td-react-button--ghost", "td-react-button--lg", "td-primary");
    expect(screen.getByRole("button", { name: "Filled" })).toHaveClass("td-react-button", "td-react-button--filled", "td-coloured");
  });

  it("gives an unpadded card so a seam between its zones runs the full width", () => {
    render(<Card padding="none" data-testid="plate"><div>Head</div><hr /><div>Body</div></Card>);
    expect(screen.getByTestId("plate")).toHaveClass("td-panel", "td-react-card--raised", "td-react-card--flush");
  });

  it("stamps the document theme and flips it on press", async () => {
    const user = userEvent.setup();
    document.documentElement.setAttribute("data-theme", "dark");
    render(<ThemeToggle storageKey={null} />);
    const toggle = await screen.findByRole("button", { name: "Switch to light theme" });
    expect(toggle).toHaveClass("td-iconbtn", "td-react-theme-toggle");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    await user.click(toggle);
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("has no critical or serious automated accessibility violations", async () => {
    const { container } = render(
      <>
        <CaseCardGrid><CaseCard href="/a" title="Case one" metrics={[{ label: "Uptime", value: "99.9%" }]} /></CaseCardGrid>
        <FeatureGrid><FeatureCard title="Feature" href="/b">Copy.</FeatureCard></FeatureGrid>
        <ComparisonTable caption="Comparison" columns={COLUMNS} rows={ROWS} />
        <CtaBanner title="Talk to us" actions={<Button>Start</Button>} />
        <Timeline label="Phases" items={[{ title: "Discovery", state: "current" }]} />
        <Prose><p>Copy.</p></Prose>
        <RectTitle text="Talk to a principal consultant." />
      </>,
    );
    const result = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(result.violations.filter(item => item.impact === "critical" || item.impact === "serious")).toEqual([]);
  });
});
