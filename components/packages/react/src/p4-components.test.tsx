/**
 * The components added 2026-08-29 to close the gaps the briefs actually hit.
 *
 * Each is tested on the contract its docs entry states — what it does, what it
 * deliberately does NOT do, and the design-law rule it was built against.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Breadcrumbs, CodeBlock, CopyChip, LogoStrip as LogoWall, Map, MegaCascade, MegaGrid, MegaTabs, Pagination, paginationRange, ProfileCard, Timeline, DataList, Faq, FileTree, LinkCells, LogoStrip, PricingTable, Progress, Range, TableOfContents, splitRectTitle } from "./index";

const SRC = dirname(fileURLToPath(import.meta.url));
const read = (name: string) => readFileSync(join(SRC, name), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

describe("Progress", () => {
  it("reports a clamped, rounded value to assistive tech and on screen", () => {
    render(<Progress label="Deployment" detail="4 of 12" value={33.4} />);
    const meter = screen.getByRole("progressbar", { name: "Deployment" });
    expect(meter).toHaveAttribute("aria-valuenow", "33");
    expect(meter).toHaveAttribute("aria-valuemin", "0");
    expect(meter).toHaveAttribute("aria-valuemax", "100");
    // The number heard is the number seen.
    expect(screen.getByText("33%")).toBeInTheDocument();
  });

  it("clamps out-of-range values rather than overflowing the track", () => {
    const { rerender } = render(<Progress value={140} aria-label="Over" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    rerender(<Progress value={-20} aria-label="Under" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("drops the value attributes when it cannot report a fraction", () => {
    render(<Progress label="Indexing" indeterminate />);
    const meter = screen.getByRole("progressbar", { name: "Indexing" });
    expect(meter).not.toHaveAttribute("aria-valuenow");
    expect(screen.queryByText(/%$/)).toBeNull();
  });

  it("carves the track and colours only the filled length", () => {
    const css = read("progress.css");
    // The track is depth: an inset pair, no category tint.
    expect(css).toMatch(/\.td-progress\.td-react-progress\s*\{[^}]*box-shadow:\s*\n?\s*inset/);
    // The bar is the one thing carrying colour, and it comes from the tone.
    expect(css).toMatch(/\.td-progress-bar\.td-react-progress-bar\s*\{[^}]*background:\s*var\(--td-progress-fill\)/);
  });
});

describe("CopyChip", () => {
  it("writes the value and reports success in ink, not a plate", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const onCopied = vi.fn();
    render(<CopyChip value="ssh root@po5.mith.tech" onCopied={onCopied} />);
    const chip = screen.getByRole("button", { name: "Copy ssh root@po5.mith.tech" });
    await userEvent.click(chip);
    expect(writeText).toHaveBeenCalledWith("ssh root@po5.mith.tech");
    expect(onCopied).toHaveBeenCalledWith("ssh root@po5.mith.tech");
    expect(chip).toHaveAttribute("data-state", "copied");
    // Heard as well as seen.
    expect(screen.getByRole("status")).toHaveTextContent("Copied");
  });

  it("names itself, because the visible text is a value rather than an action", () => {
    render(<CopyChip value="abc123" label="API key" />);
    // The face can differ from what is copied.
    expect(screen.getByText("API key")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy abc123" })).toBeInTheDocument();
  });

  it("settles on hover rather than lifting, and keeps the shadow count", () => {
    /* The control ladder descends: --td-btn-rest 2px -> --td-btn-hover 1px ->
       --td-btn-active inset. A chip that grows its outer shadow on hover is
       climbing a ladder the rest of the system descends — the bug SocialButton
       had, found again here. The count must not change either, or the two
       states snap instead of interpolating ([[L18]]). */
    const css = read("copy-chip.css");
    const body = (selector: string) =>
      new RegExp(`\\${selector}[^{]*\\{([^}]*)\\}`).exec(css)?.[1] ?? "";
    const outer = (rule: string) =>
      [...rule.matchAll(/(?:^|,)\s*(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px/g)]
        .map(m => Number(m[3]));
    const rest = outer(body(".td-react-copy"));
    const hover = outer(body(".td-react-copy:hover"));
    expect(rest.length).toBeGreaterThan(0);
    expect(hover.length).toBe(rest.length);
    expect(Math.max(...hover)).toBeLessThan(Math.max(...rest));
  });

  it("never paints a category behind the chip", () => {
    // [[L11]] / [[L25]]: the original's green plate is deliberately not ported.
    const css = read("copy-chip.css");
    const copied = /\.td-react-copy\[data-state="copied"\][^{]*\{([^}]*)\}/g;
    for (const rule of css.matchAll(copied)) {
      expect(rule[1]).not.toMatch(/background/);
      expect(rule[1]).toMatch(/color/);
    }
  });
});

describe("TableOfContents", () => {
  it("lights the current section and says so in the DOM", () => {
    render(<TableOfContents current="timeline" items={[
      { id: "scope", label: "Scope" },
      { id: "timeline", label: "Timeline" },
      { id: "gate-1", label: "Gate 1", sub: true },
    ]} />);
    const nav = screen.getByRole("navigation", { name: "On this page" });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Timeline" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "Scope" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Gate 1" })).toHaveClass("td-react-toc-item--sub");
    expect(screen.getByRole("link", { name: "Scope" })).toHaveAttribute("href", "#scope");
  });

  it("hands the anchor to a router when asked", () => {
    render(<TableOfContents current="a" renderLink={({ className, href, children }) => (
      <a className={className} href={href} data-router="yes">{children}</a>
    )} items={[{ id: "a", label: "First" }]} />);
    expect(screen.getByRole("link", { name: "First" })).toHaveAttribute("data-router", "yes");
  });

  it("keeps the seam present and unlit rather than making it appear", () => {
    // The rail must not reflow under a scrolling reader, so the border is
    // always 2px and only its colour moves ([[L33]]'s filament grammar).
    const css = read("toc.css");
    const rest = /\.td-toc-item\.td-react-toc-item\s*\{([^}]*)\}/.exec(css)!;
    expect(rest).not.toBeNull();
    expect(rest[1]).toMatch(/border-left:\s*2px solid color-mix/);
    expect(rest[1]).not.toMatch(/border-left:\s*2px solid transparent/);
    expect(css).toMatch(/\[aria-current="true"\]\s*\{[^}]*border-left-color:\s*var\(--td-brand\)/);
  });
});

describe("Range", () => {
  it("is a real range input, so the platform behaviour is not rebuilt", () => {
    render(<Range label="Team size" min={1} max={40} defaultValue={12} format={n => `${n} people`} />);
    const slider = screen.getByRole("slider", { name: "Team size" });
    expect(slider).toHaveAttribute("type", "range");
    expect(slider).toHaveAttribute("min", "1");
    expect(slider).toHaveAttribute("max", "40");
    expect(slider).toHaveValue("12");
    // The label is wired, so clicking it focuses the slider.
    expect(slider.id).toBeTruthy();
    expect(screen.getByText("Team size").getAttribute("for")).toBe(slider.id);
    expect(screen.getByText("12 people")).toBeInTheDocument();
  });

  it("drives the fill from the value, because the track paints it as a gradient stop", () => {
    const { container } = render(<Range min={0} max={200} defaultValue={50} aria-label="Budget" />);
    const slider = container.querySelector<HTMLInputElement>("input[type=range]")!;
    expect(slider.style.getPropertyValue("--pct")).toBe("25%");
  });

  it("stays controlled when a value is passed", () => {
    const onChange = vi.fn();
    render(<Range value={30} onChange={onChange} aria-label="Fixed" />);
    expect(screen.getByRole("slider")).toHaveValue("30");
  });

  it("styles both engines, because a shared selector list drops both", () => {
    // WebKit paints the fill as a gradient on the track; Firefox has a real
    // ::-moz-range-progress. One rule cannot serve them.
    const css = read("range.css");
    for (const pseudo of ["::-webkit-slider-runnable-track", "::-webkit-slider-thumb", "::-moz-range-track", "::-moz-range-thumb", "::-moz-range-progress"]) {
      expect(css.includes(pseudo), `${pseudo} is unstyled`).toBe(true);
    }
  });
});

describe("DataList", () => {
  it("renders real definition pairs so it is read as pairs", () => {
    const { container } = render(<DataList label="Engagement detail" rows={[
      { label: "Engagement", value: "Commercely", meta: "11 weeks" },
      { label: "Owner", value: "Manoj Bhat", href: "/team/manoj" },
    ]} />);
    const list = screen.getByLabelText("Engagement detail");
    expect(list.tagName).toBe("DL");
    expect(container.querySelectorAll("dt")).toHaveLength(2);
    expect(container.querySelectorAll("dd")).toHaveLength(2);
    expect(screen.getByText("11 weeks")).toHaveClass("td-react-datalist-meta");
    expect(screen.getByRole("link", { name: /Manoj Bhat/ })).toHaveAttribute("href", "/team/manoj");
  });

  it("hands a linked row to a router when asked", () => {
    render(<DataList renderLink={({ className, href, children }) => (
      <a className={className} href={href} data-router="yes">{children}</a>
    )} rows={[{ label: "Owner", value: "MB", href: "/x" }]} />);
    expect(screen.getByRole("link")).toHaveAttribute("data-router", "yes");
  });

  it("presses its rows rather than tinting them", () => {
    const css = read("data-list.css");
    const hover = /\.td-react-datalist-row:hover\s*\{([^}]*)\}/.exec(css)!;
    expect(hover).not.toBeNull();
    expect(hover[1]).toMatch(/var\(--td-row-hover\)/);
    // The row surface is the page's own, never a category.
    expect(hover[1]).toMatch(/background:\s*var\(--td-surface\)/);
  });
});

describe("Faq", () => {
  it("is a real disclosure, wired both ways", async () => {
    render(<Faq label="Questions" items={[
      { id: "cost", question: "What does it cost?", answer: <p>Six lakh up.</p> },
      { id: "time", question: "How long?", answer: <p>Nine weeks.</p> },
    ]} />);
    const first = screen.getByRole("button", { name: "What does it cost?" });
    expect(first).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(first);
    expect(first).toHaveAttribute("aria-expanded", "true");
    // The panel the button controls is the region it names.
    const region = screen.getByRole("region", { name: "What does it cost?" });
    expect(region.id).toBe(first.getAttribute("aria-controls"));
  });

  it("hides a closed answer from in-page search, not just from view", () => {
    // A CSS-hidden panel is still found by find-in-page in some browsers, which
    // scrolls the reader to text they cannot see. The attribute is the fix.
    const { container } = render(<Faq items={[{ id: "a", question: "Q", answer: "A" }]} />);
    expect(container.querySelector(".td-react-faq-a")).toHaveAttribute("hidden");
    const css = read("faq.css");
    expect(css).toMatch(/\[hidden\]\s*\{\s*display:\s*none/);
  });

  it("closes the previous question when single is set", async () => {
    render(<Faq single items={[
      { id: "a", question: "First", answer: "A" },
      { id: "b", question: "Second", answer: "B" },
    ]} />);
    await userEvent.click(screen.getByRole("button", { name: "First" }));
    await userEvent.click(screen.getByRole("button", { name: "Second" }));
    expect(screen.getByRole("button", { name: "First" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "Second" })).toHaveAttribute("aria-expanded", "true");
  });
});

describe("LinkCells", () => {
  it("makes the whole cell one link, so there is one tab stop per destination", () => {
    render(<LinkCells label="Keep reading" items={[
      { kicker: "Guide", title: "Migrating from Tally", detail: "In parallel.", href: "/a" },
      { title: "Pricing", href: "/b" },
    ]} />);
    expect(screen.getByRole("navigation", { name: "Keep reading" })).toBeInTheDocument();
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/a");
    expect(links[0]).toHaveClass("td-react-linkcell");
    // The kicker and detail live inside the same link.
    expect(links[0]).toHaveTextContent("Guide");
    expect(links[0]).toHaveTextContent("In parallel.");
  });

  it("hands the anchor to a router when asked", () => {
    render(<LinkCells renderLink={({ className, href, children }) => (
      <a className={className} href={href} data-router="yes">{children}</a>
    )} items={[{ title: "One", href: "/x" }]} />);
    expect(screen.getByRole("link")).toHaveAttribute("data-router", "yes");
  });
});

describe("LogoStrip", () => {
  it("carries every mark's name as readable text", () => {
    // A logo is a picture of a word: without the name the wall is a row of
    // unlabelled images to a screen reader.
    render(<LogoStrip label="Trusted by" items={[
      { name: "Rework Industries", logo: <svg /> },
      { name: "Coastal Freight", logo: <svg />, href: "/c" },
    ]} />);
    expect(screen.getByText("Rework Industries")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Coastal Freight" })).toHaveAttribute("href", "/c");
  });

  /* Both distributions, because the registry stylesheet is hand-authored and
     the plate was in both. `P` is the only thing that differs. */
  const STYLESHEETS: [label: string, css: string, P: string][] = [
    ["package", read("logo-strip.css"), "react"],
    ["registry", readFileSync(join(SRC, "../../../registry/tonaldepth/logo-strip.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, ""), "registry"],
  ];
  /** Every rung of the artwork ladder: the two theme rests and the lit state. */
  const artRungs = (css: string, P: string) => [...css.matchAll(new RegExp(`td-${P}-logos-art[^{]*\\{[^}]*?filter: ([^;]+);`, "g"))].map(m => m[1]);

  it("flattens the artwork to a silhouette rather than altering it, and is legible in both themes", () => {
    for (const [label, css, P] of STYLESHEETS) {
      // `grayscale(1)` kept each mark's own values, so a near-black logo stayed
      // near-black and vanished on a dark page. `brightness(0)` is what makes
      // legibility independent of the colour its owner picked.
      expect(css, label).toMatch(new RegExp(`\\.td-${P}-logos-art \\{[^}]*filter: brightness\\(0\\) invert\\(0\\) opacity\\(0\\.62\\)`));
      expect(css, label).toMatch(new RegExp(`\\[data-theme="dark"\\] \\.td-${P}-logos-art \\{ filter: brightness\\(0\\) invert\\(1\\)`));
      expect(css, label).toMatch(new RegExp(`prefers-color-scheme: dark[\\s\\S]*?logos-art \\{ filter: brightness\\(0\\) invert\\(1\\)`));
      // Filtered, never rewritten: no rule touches the artwork's own colours.
      expect(css, label).not.toMatch(new RegExp(`\\.td-${P}-logos-art[^{]*\\{[^}]*\\bfill:`));
    }
  });

  it("lights the hovered mark with a white shadow and puts no plate under it", () => {
    // 2026-08-30: *"The logo plate looks bad. just add a small white shadow the
    // plates look ugly."* The near-white chip was a flat fill behind every
    // mark, which on `#F5F5F5` read as a rendering fault rather than a state.
    // A `drop-shadow` follows the glyph's own alpha, so the light is behind the
    // MARK rather than under a rectangle containing it.
    for (const [label, css, P] of STYLESHEETS) {
      const item = css.match(new RegExp(`\\.td-logos-item\\.td-${P}-logos-item \\{[\\s\\S]*?\\n\\}`))![0];
      const hover = css.match(new RegExp(`\\.td-logos-item\\.td-${P}-logos-item:hover,[\\s\\S]*?\\n\\}`))![0];
      for (const [rung, body] of [["rest", item], ["hover", hover]] as const) {
        expect(body, `${label} ${rung}`).not.toMatch(/background:/);
        expect(body, `${label} ${rung}`).not.toMatch(/box-shadow:/);
      }
      expect(hover, label).toMatch(/transform: scale\(1\.14\)/);

      const lit = css.match(new RegExp(`:hover \\.td-${P}-logos-art,[\\s\\S]*?filter: ([^;]+);`))![1];
      expect(lit, label).toMatch(/drop-shadow\(0 0 5px rgb\(255 255 255 \/ 0\.55\)\)/);
      expect(lit, label).toMatch(/drop-shadow\(0 0 13px rgb\(255 255 255 \/ 0\.3\)\)/);
    }
  });

  it("keeps the artwork ladder interpolable — same functions at every rung, unlit in the light's own colour", () => {
    // [[L18]] one property along. `filter: none` on hover against a filter list
    // at rest is a mismatched list, so the silhouette SNAPPED off instead of
    // fading; and an unlit `transparent` shadow is black at zero alpha, so the
    // transition would smear the mark on its way to being lit ([[L20]]).
    for (const [label, css, P] of STYLESHEETS) {
      // Rest, the two dark rests, and the lit state — `artRungs` finds all four.
      const rungs = artRungs(css, P);
      expect(rungs.length, label).toBe(4);
      const shape = (filter: string) => filter.match(/[a-z-]+\(/g)!.join(" ");
      expect(new Set(rungs.map(shape)).size, `${label}: ${rungs.map(shape).join(" | ")}`).toBe(1);
      for (const rung of rungs) {
        expect(rung, label).not.toMatch(/\btransparent\b/);
        expect(rung, label).not.toBe("none");
      }
    }
  });

  it("gives the moving track room to show a hover at all", () => {
    // The viewport clips (`overflow: hidden`), so inside `scroll` — the variant
    // the homepage hero runs — the scaled mark and its light were sliced off at
    // the top and bottom. The padding is where they go; the negative margin
    // gives the strip back the height it would have had.
    for (const [label, css, P] of STYLESHEETS) {
      const viewport = css.match(new RegExp(`\\.td-${P}-logos-viewport \\{[\\s\\S]*?\\n\\}`))![0];
      expect(viewport, label).toMatch(new RegExp(`padding-block: var\\(--td-${P}-logos-bleed\\)`));
      expect(viewport, label).toMatch(new RegExp(`margin-block: calc\\(var\\(--td-${P}-logos-bleed\\) \\* -1\\)`));
    }
  });

  it("treats a black mark and a white one identically, in both themes", () => {
    // [[L52]]'s own rule, and the reason the plate shipped untested against a
    // light ground. What makes the treatment value-independent is that it is
    // applied to the WRAPPER and never to the artwork, so nothing about the
    // mark's own colour can reach it.
    const marks = [
      { name: "Ink", logo: <svg data-mark="black"><path fill="#000" d="M0 0h1v1H0z" /></svg> },
      { name: "Paper", logo: <svg data-mark="white"><path fill="#fff" d="M0 0h1v1H0z" /></svg> },
    ];
    for (const theme of ["light", "dark"]) {
      document.documentElement.setAttribute("data-theme", theme);
      const { container, unmount } = render(<LogoWall items={marks} />);
      const arts = [...container.querySelectorAll(".td-react-logos-art")];
      expect(arts, theme).toHaveLength(2);
      // Same wrapper, same class, no per-mark styling of any kind: the two are
      // indistinguishable to every rule in the stylesheet.
      expect(new Set(arts.map(art => art.className)).size, theme).toBe(1);
      for (const art of arts) expect(art.getAttribute("style"), theme).toBeNull();
      unmount();
    }
    document.documentElement.removeAttribute("data-theme");
  });

  it("treats a picked file exactly like an inline mark", () => {
    // The docs bench hands it an <img> built from an object URL. The treatment
    // lives on the ITEM rather than the artwork, so the format changes nothing
    // about how a logo behaves.
    const { container } = render(<LogoWall items={[{ name: "Client", logo: <img alt="" src="blob:x" /> }]} />);
    expect(container.querySelector(".td-react-logos-item")).not.toBeNull();
    expect(container.querySelector(".td-react-logos-art img")).not.toBeNull();
    expect(screen.getByText("Client")).toBeInTheDocument();
    expect(read("logo-strip.css")).toMatch(/\.td-react-logos-art :is\(img, svg\)/);
  });
});

describe("RectTitle line splitting", () => {
  it("ignores punctuation at either end when balancing the lines", () => {
    // "Talk to a principal consultant." is the case that shows it: counting the
    // full stop pushes the break a word early, and the fitter's cap cannot
    // close the gap that leaves.
    const withStop = splitRectTitle("Talk to a principal consultant.", 2);
    const withoutStop = splitRectTitle("Talk to a principal consultant", 2);
    expect(withStop.map(l => l.replace(/[^\p{L}\p{N} ]/gu, ""))).toEqual(withoutStop);
  });

  it("puts the same words on the same lines whatever punctuation is at the edges", () => {
    const plain = splitRectTitle("Run the whole rollout with one team", 2);
    const punctuated = splitRectTitle("Run the whole rollout with one team.", 2);
    expect(punctuated.map(l => l.replace(/[.,;:!?]$/, ""))).toEqual(plain);
  });
});

describe("FileTree", () => {
  const NODES = [
    { id: "root", name: "commercely", children: [
      { id: "checkout", name: "checkout.tsx", meta: "TSX", href: "/checkout" },
      { id: "api", name: "api", children: [{ id: "routes", name: "routes.ts" }] },
    ] },
  ];

  it("expands a folder and reveals only what is under it", async () => {
    render(<FileTree label="Repository" nodes={NODES} />);
    const folder = screen.getByRole("button", { name: /commercely/ });
    expect(folder).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: /checkout\.tsx/ })).toBeNull();
    await userEvent.click(folder);
    expect(folder).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /checkout\.tsx/ })).toHaveAttribute("href", "/checkout");
    // The nested folder is a folder, not a file: it expands rather than links.
    expect(screen.getByRole("button", { name: /api/ })).toHaveAttribute("aria-expanded", "false");
  });

  it("hides a closed folder with `hidden`, not with a stylesheet", () => {
    // A CSS-hidden panel is still found by in-page search in some browsers,
    // which is how a reader ends up scrolled to text they cannot see.
    const { container } = render(<FileTree nodes={NODES} />);
    expect(container.querySelector(".td-react-tree-children")).toHaveAttribute("hidden");
    const css = read("file-tree.css");
    expect(css).toMatch(/\.td-tree-children\.td-react-tree-children\[hidden\]\s*\{\s*display:\s*none/);
  });

  it("is a list of disclosures and deliberately not an ARIA tree widget", () => {
    // Every row is in the tab order with `aria-expanded` on the folders. There
    // is no roving tabstop and no arrow-key navigation, so claiming role=tree
    // would ship a widget the keyboard does not honour.
    const { container } = render(<FileTree label="Repository" defaultOpen={["root"]} nodes={NODES} />);
    expect(container.querySelector('[role="tree"]')).toBeNull();
    expect(container.querySelector('[role="treeitem"]')).toBeNull();
    expect(screen.getByRole("navigation", { name: "Repository" })).toBeInTheDocument();
  });

  it("marks the file being read without a wash, and never lamps the chevron", () => {
    const { container } = render(<FileTree defaultOpen={["root"]} activeId="checkout" nodes={NODES} />);
    expect(container.querySelector('[data-active="true"]')).toHaveAttribute("aria-current", "true");
    const css = read("file-tree.css");
    // Rows press ([[L34]]) on the system's SHARED ladder, which is what gets
    // them a visible press in dark mode — the literals they used to carry were
    // tuned against the light palette only.
    const ladder: [string, string][] = [[":hover", "hover"], [":active", "press"], ['\\[data-active="true"\\]', "selected"]];
    for (const [rung, token] of ladder) {
      const rule = new RegExp(`\\.td-tree-row\\.td-react-tree-row${rung}\\s*\\{[^}]*box-shadow: var\\(--td-row-${token}\\)`);
      expect(rule.test(css), `the row does not take --td-row-${token} at ${rung}`).toBe(true);
    }
    // ...and none of them tints. Papaya is ink here, never a fill ([[L11]]).
    expect(css).not.toMatch(/background:\s*color-mix\(in srgb, var\(--td-brand\)/);
    // The chevron is a direction mark: it turns, it does not glow.
    const chevronRules = [...css.matchAll(/([^{}]*tree-chevron[^{}]*)\{([^{}]*)\}/g)];
    expect(chevronRules.length).toBeGreaterThan(1);
    for (const rule of chevronRules) expect(rule[2], `${rule[1].trim()} lamps the chevron`).not.toMatch(/drop-shadow/);
  });
});

describe("PricingTable", () => {
  const PLANS = [
    { id: "discovery", name: "Discovery", price: "₹2.4L", period: "/ 2 weeks", features: ["Architecture review"], action: <button type="button">Start discovery</button> },
    { id: "engagement", name: "Engagement", price: "₹8L+", period: "/ month", featured: true, features: ["Weekly demos", "Senior pair"], action: <button type="button">Start engagement</button> },
  ];

  it("gives every plan its own labelled region and its own way to act", () => {
    // The whole point of the grid over a comparison matrix: the reader decides
    // and acts in the same place.
    render(<PricingTable label="Engagement models" plans={PLANS} />);
    const plan = screen.getByRole("article", { name: "Engagement" });
    expect(plan).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start engagement" })).toBeInTheDocument();
    expect(screen.getByText("₹8L+")).toBeInTheDocument();
    expect(screen.getByText("/ month")).toBeInTheDocument();
  });

  it("renders the price exactly as given — it does no currency work", () => {
    render(<PricingTable plans={[{ id: "a", name: "Flat", price: "on request", features: [] }]} />);
    expect(screen.getByText("on request")).toBeInTheDocument();
  });

  it("marks the featured plan with depth and papaya ink, never a fill", () => {
    const { container } = render(<PricingTable plans={PLANS} />);
    expect(container.querySelector('[data-featured="true"]')).not.toBeNull();
    expect(screen.getByText("Most picked")).toBeInTheDocument();
    const css = read("pricing-table.css");
    // No card is filled with the brand colour ([[L11]]).
    expect(css).not.toMatch(/background:\s*[^;]*var\(--td-brand\)/);
    // The mark is papaya as ink on a carved chip.
    const badge = /\.td-price-badge\.td-react-price-badge\s*\{([^}]*)\}/.exec(css)!;
    expect(badge[1]).toMatch(/color:\s*var\(--td-brand-text\)/);
    expect(badge[1]).toMatch(/box-shadow:\s*\n?\s*inset/);
    // The featured card keeps the SAME four shadow slots as an ordinary one —
    // the ring turns papaya rather than a sixth slot being added ([[L18]]).
    // Split on the shadow's own commas — a nested color-mix() carries plenty.
    const slots = (rule: string) => {
      const value = /box-shadow:([^;]*);/.exec(rule)![1];
      let depth = 0, count = 1;
      for (const character of value) {
        if (character === "(") depth += 1;
        else if (character === ")") depth -= 1;
        else if (character === "," && depth === 0) count += 1;
      }
      return count;
    };
    const plain = /\.td-price\.td-react-price\s*\{[^}]*\}/.exec(css)![0];
    const featured = /\.td-price\.td-react-price\[data-featured="true"\]\s*\{[^}]*\}/.exec(css)![0];
    expect(slots(featured)).toBe(slots(plain));
    expect(featured).toMatch(/0 0 0 1px color-mix\(in srgb, var\(--td-brand\)/);
  });
});

describe("CodeBlock", () => {
  const SOURCE = 'const id = getRouterParam(event, "id");';

  it("copies the raw source even when the markup shown is highlighted", async () => {
    // The two can disagree; the text that RUNS is the one that gets copied.
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<CodeBlock language="TypeScript" code={SOURCE}><span className="td-cb-k">const</span></CodeBlock>);
    await userEvent.click(screen.getByRole("button", { name: "Copy code" }));
    expect(writeText).toHaveBeenCalledWith(SOURCE);
  });

  it("falls back to the raw source when nothing is highlighted", () => {
    render(<CodeBlock code={SOURCE} copy={false} />);
    expect(screen.getByText(SOURCE)).toBeInTheDocument();
  });

  it("houses the listing in a Frame's well rather than on a plate of its own", () => {
    // Chrome is raised, data is recessed ([[L32]]). The listing carries no
    // plate: the well it sits in already is one.
    const { container } = render(<CodeBlock code={SOURCE} title="route.ts" />);
    const well = container.querySelector(".td-react-frame-well");
    expect(well).not.toBeNull();
    expect(well!.querySelector(".td-react-codeblock")).not.toBeNull();
    const css = read("code-block.css");
    const listing = /\.td-codeblock\.td-react-codeblock\s*\{([^}]*)\}/.exec(css)!;
    expect(listing[1]).toMatch(/background:\s*transparent/);
    expect(listing[1]).toMatch(/box-shadow:\s*none/);
  });

  it("carries no highlighter and no raw colour — the token classes are tokens", () => {
    const source = readFileSync(join(SRC, "code-block.tsx"), "utf8");
    // Nothing is imported but React, the two components it composes and its css.
    const imports = [...source.matchAll(/from "([^"]+)"/g)].map(m => m[1]);
    expect(imports).toEqual(["react", "./utils", "./copy-chip", "./frame"]);
    const css = read("code-block.css");
    for (const token of ["td-cb-k", "td-cb-s", "td-cb-n", "td-cb-c"]) {
      expect(css, `${token} has no rule`).toMatch(new RegExp(`\\.${token}\\s*\\{[^}]*var\\(--td-`));
    }
    // The design system's own panel hardcodes #1A1815 / #F0EDE5. Neither is here.
    expect(css.replace(/\/\*[\s\S]*?\*\//g, "")).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});

describe("Breadcrumbs", () => {
  const TRAIL = [
    { label: "mith.tech", href: "/" },
    { label: "Work", href: "/work" },
    { label: "Commercely", href: "/work/commercely" },
  ];

  it("marks the last crumb as the current page and refuses to link it", () => {
    // A link to where you already are is not a destination — the href is
    // deliberately dropped rather than honoured.
    render(<Breadcrumbs items={TRAIL} />);
    expect(screen.queryByRole("link", { name: "Commercely" })).toBeNull();
    expect(screen.getByText("Commercely")).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Work" })).toHaveAttribute("href", "/work");
  });

  it("renders one ordered list inside one landmark, whatever the form", () => {
    const { container } = render(<Breadcrumbs separator="condensed" label="Section" items={TRAIL} />);
    expect(screen.getByRole("navigation", { name: "Section" })).toBeInTheDocument();
    expect(container.querySelectorAll("ol")).toHaveLength(1);
    expect(container.querySelector(".td-react-bc--condensed")).not.toBeNull();
  });

  it("draws all three forms from one prop, as punctuation rather than icons", () => {
    const css = read("breadcrumbs.css");
    // Each form is a value of `separator`; there is no housing prop to cross
    // with it, so a slash-in-a-bar cannot be built.
    expect(css).toMatch(/\.td-react-bc--chevron .td-react-bc-sep::before[\s\S]*?content:/);
    expect(css).toMatch(/\.td-react-bc--slash .td-react-bc-sep::before\s*\{\s*content:/);
    expect(css).toMatch(/\.td-react-bc--condensed\s*\{[^}]*box-shadow:/);
    const { container } = render(<Breadcrumbs separator="slash" items={TRAIL} />);
    expect(container.querySelector("svg")).toBeNull();
  });

  it("presses the crumbs that lead somewhere and never tints one", () => {
    const css = read("breadcrumbs.css");
    for (const [rung, token] of [[":hover", "hover"], [":active", "press"]]) {
      expect(new RegExp(`a\\.td-bc-item\\.td-react-bc-item${rung}\\s*\\{[^}]*box-shadow: var\\(--td-row-${token}\\)`).test(css)).toBe(true);
    }
    // The current crumb is ink, not a wash, and takes no depth at all.
    const current = /\.td-bc-item\.td-react-bc-item\[aria-current="page"\]\s*\{([^}]*)\}/.exec(css)!;
    expect(current[1]).not.toMatch(/background|box-shadow/);
    expect(css).not.toMatch(/background:\s*color-mix\(in srgb, var\(--td-brand\)/);
  });
});

describe("Pagination", () => {
  it("cuts the trail only where a cut saves more than one number", () => {
    // 1 … 7 8 9 … 42 — the design system's own truncated example.
    expect(paginationRange(8, 42, 1, 1)).toEqual([1, "gap", 7, 8, 9, "gap", 42]);
    // Nothing to save: a short trail shows every page.
    expect(paginationRange(1, 4, 1, 1)).toEqual([1, 2, 3, 4]);
    // Exactly one page would be hidden on the left, so it is shown instead of
    // an ellipsis that costs the same width and takes away a target.
    expect(paginationRange(4, 9, 1, 1)).toEqual([1, 2, 3, 4, 5, "gap", 9]);
  });

  it("refuses to make the current page a target", () => {
    render(<Pagination page={3} pageCount={9} onPageChange={() => {}} />);
    expect(screen.queryByRole("button", { name: "Page 3" })).toBeNull();
    expect(screen.getByText("3")).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Page 4" })).toBeInTheDocument();
  });

  it("reports the page chosen and keeps the ends drawn but out of reach", async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} pageCount={9} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Page 2" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
    // The previous control is still there — the row must not change width as
    // the reader walks it — but it is not a control.
    const previous = screen.getByRole("button", { name: "Previous page" });
    expect(previous.tagName).toBe("SPAN");
    expect(previous).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(previous);
    expect(onPageChange).toHaveBeenCalledTimes(1);
  });

  it("renders real anchors when given a href builder", () => {
    render(<Pagination page={2} pageCount={9} href={n => `/blog/page/${n}`} />);
    expect(screen.getByRole("link", { name: "Page 3" })).toHaveAttribute("href", "/blog/page/3");
  });

  it("presses rather than filling, and never lamps a direction mark", () => {
    const css = read("pagination.css");
    for (const [rung, token] of [[":hover", "hover"], [":active", "press"]]) {
      expect(new RegExp(`\\.td-react-pagination-item${rung}\\s*\\{[^}]*box-shadow: var\\(--td-row-${token}\\)`).test(css)).toBe(true);
    }
    const current = /\.td-react-pagination-item--current\s*\{([^}]*)\}/.exec(css)!;
    expect(current[1]).toMatch(/color:\s*var\(--td-brand-text\)/);
    expect(current[1]).toMatch(/var\(--td-row-selected\)/);
    // No page is filled with the brand colour, and no mark glows.
    expect(css).not.toMatch(/background:\s*[^;]*var\(--td-brand\)/);
    expect(css).not.toMatch(/drop-shadow/);
  });
});

describe("Timeline on the roadmap axis", () => {
  // A roadmap is this component measured on a different axis — same rail, same
  // dot, same three states — so it is a prop rather than a second component.
  const ITEMS = [
    { title: "Stripe and Razorpay", time: "Q1 2026", state: "done" as const },
    { title: "Self-hosted Plane", time: "Q2 2026", state: "current" as const },
  ];

  it("leads each item with its period instead of trailing a timestamp", () => {
    const { container } = render(<Timeline axis="period" label="Roadmap" items={ITEMS} />);
    expect(container.querySelector(".td-mk-timeline-time")).toBeNull();
    const periods = [...container.querySelectorAll(".td-mk-timeline-period")].map(n => n.textContent);
    expect(periods).toEqual(["Q1 2026", "Q2 2026"]);
    // The period leads the item: it comes before the title in the body.
    const body = container.querySelector(".td-mk-timeline-body")!;
    expect(body.firstElementChild).toHaveClass("td-mk-timeline-period");
  });

  it("keeps the elapsed axis as the default, trailing the row", () => {
    const { container } = render(<Timeline label="Phases" items={ITEMS} />);
    expect(container.querySelector(".td-mk-timeline-period")).toBeNull();
    expect(container.querySelector(".td-mk-timeline-time")).toHaveTextContent("Q1 2026");
  });

  it("shows one axis or the other, never both, and never pulses", () => {
    // `time` means a different thing on each axis and an item has one position
    // on one axis, so rendering both would be two answers to one question.
    const { container } = render(<Timeline axis="period" items={ITEMS} />);
    expect(container.querySelectorAll(".td-mk-timeline-period, .td-mk-timeline-time")).toHaveLength(2);
    const css = read("timeline.css");
    // Papaya as ink on the period, never a fill ([[L11]]).
    expect(/\.td-mk-timeline-period\s*\{([^}]*)\}/.exec(css)![1]).toMatch(/color:\s*var\(--td-brand-text\)/);
    // The design system's roadmap pulses its live dot forever. It does not here.
    expect(css).not.toMatch(/animation/);
  });
});

describe("Map", () => {
  const PINS = [
    { id: "blr", label: "Bengaluru", x: 32, y: 74 },
    { id: "bom", label: "Mumbai", x: 20, y: 60, tone: "accent" as const },
  ];

  it("places each pin at the percentage it was given, and nowhere else", () => {
    const { container } = render(<Map label="Where we work" pins={PINS} />);
    const first = container.querySelector<HTMLElement>(".td-react-map-pin")!;
    expect(first.style.left).toBe("32%");
    expect(first.style.top).toBe("74%");
    expect(screen.getByRole("group", { name: "Where we work" })).toBeInTheDocument();
  });

  it("reaches no network and draws no ground of its own", () => {
    // No tile provider, no key, no attribution line: the ground is whatever
    // outline the caller passes, and nothing is fetched.
    const source = readFileSync(join(SRC, "map.tsx"), "utf8");
    expect(source).not.toMatch(/fetch|XMLHttpRequest|https?:\/\//);
    const { container } = render(<Map label="Bare" pins={PINS} />);
    expect(container.querySelector(".td-react-map-ground")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });

  it("keeps every pin name readable when the labels are turned off", () => {
    render(<Map label="Dense" showLabels={false} pins={PINS} />);
    // Hidden visually, not from the accessibility tree.
    expect(screen.getByText("Bengaluru")).toHaveClass("td-react-map-pin-label--quiet");
  });

  it("carves the ground and lights each pin from a named light", () => {
    const css = read("map.css");
    // The ground is the surface pressed in, not a gradient wash ([[L11]], [[L32]]).
    const ground = /\.td-map\.td-react-map\s*\{([^}]*)\}/.exec(css)!;
    expect(ground[1]).toMatch(/box-shadow:\s*var\(--td-inset-soft\)/);
    expect(css).not.toMatch(/linear-gradient\([^)]*var\(--td-brand\)/);
    // The socket is the map's own material; the lens carries the colour ([[L25]]).
    expect(/\.td-map-pin-dot\.td-react-map-pin-dot\s*\{([^}]*)\}/.exec(css)![1]).toMatch(/background:\s*var\(--td-surface\)/);
    expect(/\.td-react-map-pin-dot::after\s*\{([^}]*)\}/.exec(css)![1]).toMatch(/background:\s*var\(--td-lamp-glow\)/);
    // Never `currentColor` — at rest that is ink, and ink paints a smear ([[L20]]).
    expect(css).not.toMatch(/--td-lamp-glow:\s*currentColor/);
  });
});

describe("Faq, the one version", () => {
  // `09-interaction/disclose` is this component with the plate off, so it is a
  // variant rather than a second component.
  const ONE = [{ id: "how", question: "How does it work?", answer: <p>Like this.</p> }];

  it("keeps the whole disclosure contract when the plate comes off", async () => {
    render(<Faq items={ONE} />);
    const question = screen.getByRole("button", { name: "How does it work?" });
    expect(question).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(question);
    expect(question).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("region", { name: "How does it work?" })).toBeInTheDocument();
  });

  it("carves the seams between questions rather than drawing them", () => {
    // A 1px border is a line painted ON the surface. A seam is the surface
    // parting — the shade cut in, and the light on the lip below it ([[L03]]).
    const css = read("faq.css");
    expect(css).not.toMatch(/border-bottom: 1px solid/);
    const seam = /\.td-react-faq-item \+ \.td-react-faq-item::before \{([^}]*)\}/.exec(css)!;
    expect(seam[1]).toMatch(/background: color-mix\(in srgb, var\(--td-shadow-dark\)/);
    expect(seam[1]).toMatch(/box-shadow: 0 1px 0 color-mix\(in srgb, var\(--td-shadow-light\)/);
    // Inset from both ends: a full-bleed rule divides a card into two cards.
    expect(seam[1]).toMatch(/inset-inline: var\(--td-sp-/);
  });

  it("has exactly one version of itself", () => {
    // Two looks for one list is two things to keep beautiful.
    const { container } = render(<Faq items={ONE} />);
    expect(container.querySelector(".td-react-faq--seam")).toBeNull();
    expect(readFileSync(join(SRC, "faq.tsx"), "utf8")).not.toMatch(/FaqVariant|variant\?:/);
  });
});

describe("ProfileCard", () => {
  // `05-cards/profile` and `10-marketing/team` are the same parts in a
  // different reading order, so they are two layouts of one component.
  it("draws both design pages from one component and one set of parts", () => {
    const { container, rerender } = render(<ProfileCard name="Manoj M" role="Principal" initials="MM" />);
    expect(container.querySelector(".td-mk-profile--row")).not.toBeNull();
    expect(screen.getByRole("article", { name: "Manoj M" })).toBeInTheDocument();
    rerender(<ProfileCard layout="stack" name="Manoj M" role="Principal" initials="MM">Owns the runbook.</ProfileCard>);
    expect(container.querySelector(".td-mk-profile--stack")).not.toBeNull();
    expect(screen.getByText("Owns the runbook.")).toBeInTheDocument();
  });

  it("lets a photograph beat the initials", () => {
    const { container } = render(<ProfileCard name="Manoj M" initials="MM" avatar={<img alt="" src="/m.jpg" />} />);
    expect(container.querySelector(".td-mk-profile-avatar img")).not.toBeNull();
    expect(container.querySelector(".td-mk-profile-avatar")).not.toHaveTextContent("MM");
  });

  it("gives up the whole-card target when the card carries actions", async () => {
    // A full-card overlay on top of an email button is an overlay that eats
    // the button, so `actions` wins and `href` links the name alone.
    const onClick = vi.fn();
    const { container, rerender } = render(<ProfileCard name="Manoj M" href="/about" />);
    expect(container.querySelector(".td-mk-profile--link")).not.toBeNull();
    expect(container.querySelector(".td-mk-profile-namelink--cover")).not.toBeNull();
    rerender(<ProfileCard name="Manoj M" href="/about" actions={<button type="button" onClick={onClick}>Email</button>} />);
    expect(container.querySelector(".td-mk-profile--link")).toBeNull();
    expect(container.querySelector(".td-mk-profile-namelink--cover")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Email" }));
    expect(onClick).toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Manoj M" })).toHaveAttribute("href", "/about");
  });

  it("carves the mark instead of filling it, and keeps the role in ink", () => {
    const css = read("profile-card.css");
    // The team card's brand-to-accent gradient is not reproduced ([[L11]]).
    expect(css).not.toMatch(/linear-gradient/);
    expect(css).not.toMatch(/background:\s*[^;]*var\(--td-brand\)/);
    const avatar = /\.td-mk-profile-avatar\s*\{([^}]*)\}/.exec(css)!;
    expect(avatar[1]).toMatch(/background:\s*var\(--td-surface\)/);
    expect(avatar[1]).toMatch(/box-shadow:\s*\n?\s*inset/);
    // A role is not a category, so it is not papaya.
    expect(/\.td-mk-profile-role\s*\{([^}]*)\}/.exec(css)![1]).toMatch(/color:\s*var\(--td-ink-2\)/);
  });
});

describe("RectTitle line control", () => {
  it("honours an explicit break over every heuristic", () => {
    // A newline is the author saying where the line ends. It skips the
    // splitter, the automatic count and the two-line floor.
    expect(splitRectTitle("Talk to a\nprincipal consultant.")).toEqual(["Talk to a", "principal consultant."]);
    expect(splitRectTitle("One line only\n")).toEqual(["One line only"]);
    // ...and the ceiling cannot cut it back.
    expect(splitRectTitle("a\nb\nc\nd", 2)).toHaveLength(4);
  });

  it("asks for an exact count where maxLines only caps one", () => {
    const text = "Talk to a principal consultant";
    // Five words: the words-per-line heuristic holds it at two however high
    // the ceiling goes, which is what made `maxLines` look inert.
    expect(splitRectTitle(text, 4)).toHaveLength(2);
    expect(splitRectTitle(text, 3, 4)).toHaveLength(4);
    // Clamped to the word count — four lines from three words is a gap.
    expect(splitRectTitle("Run the rollout", 3, 9)).toHaveLength(3);
  });

  it("still balances the lines it is told to make", () => {
    const lines = splitRectTitle("Self hosted open source operations for growing teams", 3, 3);
    expect(lines).toHaveLength(3);
    const lengths = lines.map(l => l.length);
    expect(Math.max(...lengths) / Math.min(...lengths)).toBeLessThan(2);
  });
});

describe("LogoStrip as a carousel", () => {
  const MARKS = [
    { name: "Rework Industries", logo: <svg /> },
    { name: "Coastal Freight", logo: <svg />, href: "/c" },
  ];

  it("stays a wall until it is told to scroll", () => {
    const { container } = render(<LogoWall label="Trusted by" items={MARKS} />);
    expect(container.querySelector(".td-react-logos--scroll")).toBeNull();
    expect(container.querySelector(".td-react-logos-track")).toBeNull();
  });

  it("duplicates the run so the loop has no seam, and hides the copy from everyone", () => {
    // Without the second run the strip jumps; without `inert` on it a screen
    // reader reads the whole client list twice.
    const { container } = render(<LogoWall scroll items={MARKS} />);
    const runs = container.querySelectorAll(".td-react-logos-run");
    expect(runs).toHaveLength(2);
    expect(runs[1]).toHaveAttribute("aria-hidden", "true");
    expect(runs[1]).toHaveAttribute("inert");
    // The real run keeps the only copy of each name and each link.
    expect(screen.getAllByRole("link", { name: "Coastal Freight" })).toHaveLength(1);
  });

  it("takes its speed and direction from props rather than a stylesheet edit", () => {
    const { container } = render(<LogoWall scroll speed={18} reverse items={MARKS} />);
    const strip = container.querySelector<HTMLElement>(".td-react-logos--scroll")!;
    expect(strip.style.getPropertyValue("--td-logos-speed")).toBe("18s");
    expect(strip).toHaveAttribute("data-reverse", "true");
  });

  it("pauses when engaged with, and stops dead under reduced motion", () => {
    const css = read("logo-strip.css");
    // A mark that slides out from under the pointer is a link nobody can click.
    expect(css).toMatch(/:hover \.td-react-logos-track,\s*\n?\s*\.td-react-logos--scroll:focus-within \.td-react-logos-track \{ animation-play-state: paused/);
    // Slowing an infinite animation is not honouring the preference. The file
    // carries two reduced-motion blocks (the wall had one already), so the
    // track's rules are matched directly rather than by slicing a block out.
    expect(css).toMatch(/\.td-react-logos-track \{ animation: none; \}/);
    expect(css).toMatch(/\.td-react-logos-viewport \{ overflow-x: auto; \}/);
  });
});

describe("MegaCascade", () => {
  const GROUPS = [
    { id: "run", label: "What we run", branches: [
      { id: "erp", title: "ERP", hint: "Process and hosting", href: "/erp", items: [{ href: "/erpnext", title: "ERPNext" }, { href: "/migrate", title: "Migration" }] },
      { id: "commerce", title: "Commerce", items: [{ href: "/medusa", title: "Medusa" }] },
    ] },
    { id: "know", label: "Knowledge", branches: [
      { id: "guides", title: "Guides", items: [{ href: "/g1", title: "Guide one" }] },
    ] },
  ];

  it("cascades: the category picks the branches, the branch picks the items", async () => {
    render(<MegaCascade groups={GROUPS} />);
    // Column 2 shows the first category's branches; column 3 the first branch's items.
    expect(screen.getByRole("tab", { name: /ERP/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ERPNext" })).toBeInTheDocument();
    // Column 1 is click-only, and picking a category resets column 2 to its first branch.
    await userEvent.click(screen.getByRole("tab", { name: "Knowledge" }));
    expect(screen.getByRole("link", { name: "Guide one" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "ERPNext" })).toBeNull();
  });

  it("switches column 3 on hover of column 2, but never on hover of column 1", async () => {
    // Hovering across column 1 on the way to column 2 would otherwise change
    // the selection on every row the pointer crosses.
    render(<MegaCascade groups={GROUPS} />);
    await userEvent.hover(screen.getByRole("tab", { name: "Knowledge" }));
    expect(screen.getByRole("link", { name: "ERPNext" })).toBeInTheDocument();
    await userEvent.hover(screen.getByRole("tab", { name: /Commerce/ }));
    expect(screen.getByRole("link", { name: "Medusa" })).toBeInTheDocument();
  });

  it("gives both rails a roving tabstop", () => {
    const { container } = render(<MegaCascade groups={GROUPS} />);
    const rails = container.querySelectorAll('[role="tablist"]');
    expect(rails).toHaveLength(2);
    for (const rail of rails) {
      const focusable = [...rail.querySelectorAll('[role="tab"]')].filter(t => t.getAttribute("tabindex") === "0");
      expect(focusable).toHaveLength(1);
    }
  });

  it("hands every leaf to the router when asked", () => {
    render(<MegaCascade groups={GROUPS} renderLink={({ className, href, children }) => (
      <a className={className} href={href} data-router="yes">{children}</a>
    )} />);
    expect(screen.getByRole("link", { name: "ERPNext" })).toHaveAttribute("data-router", "yes");
  });

  it("puts every column in a well", () => {
    // Chrome is raised, what you are choosing between is recessed ([[L32]]).
    const css = read("mega-menu.css");
    const { container } = render(<MegaCascade groups={GROUPS} />);
    expect(container.querySelectorAll(".td-mega-list")).toHaveLength(2);
    expect(container.querySelector(".td-mega-content")).not.toBeNull();
    // The rows take the shared ladder, which is what makes them read in dark.
    expect(css).toMatch(/\.td-mega-option\.td-react-mega-option:hover \{[^}]*box-shadow: var\(--td-row-hover\)/);
    expect(css).toMatch(/\[aria-selected="true"\] \{[^}]*box-shadow: var\(--td-row-selected\)/);
  });
});

describe("MegaTabs and MegaGrid", () => {
  const ITEMS = [
    { id: "a", label: "ERPNext", hint: "Hosting and tuning", panel: <p>The ERP pane</p> },
    { id: "b", label: "Medusa", panel: <p>The commerce pane</p> },
  ];

  it("shows one pane, and changes it on click — never on hover", async () => {
    // The pane is the panel's whole right-hand side, so a pointer crossing the
    // rail on its way anywhere would repaint most of the sheet. A rail that
    // swaps a paragraph under the pointer reads as unstable, not responsive.
    render(<MegaTabs label="Services" items={ITEMS} />);
    expect(screen.getByText("The ERP pane")).toBeInTheDocument();
    expect(screen.queryByText("The commerce pane")).toBeNull();
    await userEvent.hover(screen.getByRole("tab", { name: /Medusa/ }));
    expect(screen.getByText("The ERP pane")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: /Medusa/ }));
    expect(screen.getByText("The commerce pane")).toBeInTheDocument();
  });

  it("wires the rail to the pane as a real tablist", () => {
    render(<MegaTabs label="Services" items={ITEMS} />);
    const tab = screen.getByRole("tab", { name: /ERPNext/ });
    expect(tab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", tab.id);
  });

  it("houses the cards in a well rather than on the sheet", () => {
    // The whole reason MegaGrid exists: `display: grid` on the panel body puts
    // the cards at the same depth as their housing and nothing reads as
    // contained.
    const { container } = render(<MegaGrid min={260}><a href="/x">Card</a></MegaGrid>);
    const grid = container.querySelector<HTMLElement>(".td-react-mega-grid")!;
    expect(grid).toHaveClass("td-mega-content");
    expect(grid.style.getPropertyValue("--td-mega-card-min")).toBe("260px");
    expect(read("mega-menu.css")).toMatch(/\.td-mega-list,\s*\n\.td-mega-content|\.td-mega-content\.td-react-mega-content/);
  });
});
