import { useState } from "react";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import axe from "axe-core";
import { BottomNav, Footer, FooterBottom, FooterBrand, FooterColumn, FooterContact, FooterGrid, FooterSocial, MegaColumns, NavDrawer, SiteNavigation, WindowControls, megaCascadeSections, type MegaCascadeGroup, type MegaSection, type SiteNavigationItem } from "./index";

const SRC = dirname(fileURLToPath(import.meta.url));

/**
 * The ancestor a `position: fixed` element actually resolves its insets
 * against, or `null` when that is the viewport.
 *
 * This is the whole of the scrim defect. A transformed ancestor becomes the
 * containing block for its fixed descendants, so `inset: 0` stops meaning "the
 * viewport" and starts meaning "that box" — and nothing errors, nothing warns,
 * and the declaration still reads as correct. The properties below are the
 * ones the spec says do it.
 */
function fixedContainingBlock(node: Element): Element | null {
  const establishes = (style: CSSStyleDeclaration) => {
    const set = (value: string | null) => Boolean(value) && value !== "none" && value !== "normal";
    if (set(style.transform) || set(style.translate) || set(style.rotate) || set(style.scale)) return true;
    if (set(style.perspective) || set(style.filter) || set(style.backdropFilter)) return true;
    if (set(style.containerType)) return true;
    if (/\b(transform|perspective|filter)\b/.test(style.willChange ?? "")) return true;
    return /\b(paint|layout|strict|content)\b/.test(style.contain ?? "");
  };
  for (let parent = node.parentElement; parent && parent !== document.documentElement; parent = parent.parentElement) {
    if (establishes(getComputedStyle(parent))) return parent;
  }
  return null;
}

const ITEMS: SiteNavigationItem[] = [
  {
    kind: "menu",
    id: "services",
    label: "Services",
    title: "Services",
    content: <a href="/services/erpnext-implementation">ERP implementation</a>,
    footer: <a href="/services">All services</a>,
  },
  {
    kind: "menu",
    id: "platforms",
    label: "Platforms",
    title: "Platforms",
    description: "The software, as opposed to the engagement.",
    content: <a href="/platforms/erpnext">Frappe and ERPNext</a>,
  },
  { kind: "link", label: "Work", href: "/case-studies" },
];

const LINKS = [
  { href: "/services/erpnext-implementation", label: "ERP implementation" },
  { href: "/services/migration", label: "Migration services" },
];

function Nav(props: { items?: SiteNavigationItem[] }) {
  return (
    <SiteNavigation
      brand={<a className="td-brand" href="/">MITH.TECH</a>}
      items={props.items ?? ITEMS}
      actions={<button type="button">Get an estimate</button>}
    />
  );
}

describe("SiteNavigation", () => {
  it("opens the panel its trigger names and leaves it open", async () => {
    const user = userEvent.setup();
    render(<Nav />);
    const trigger = screen.getByRole("button", { name: /Services/ });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const panel = document.getElementById("services-mega-panel");
    expect(panel).not.toBeNull();
    expect(within(panel as HTMLElement).getByRole("link", { name: "ERP implementation" })).toBeInTheDocument();
  });

  it("carries no data-nav, so the design system's runtime cannot claim its triggers", async () => {
    const user = userEvent.setup();
    render(<Nav />);
    const trigger = screen.getByRole("button", { name: /Services/ });
    await user.click(trigger);

    // The vanilla runtime binds `.td-navbtn[data-nav]` and forces
    // aria-expanded="false" on every match whenever it closes all menus. A
    // trigger that carries the attribute announces "collapsed" while the panel
    // it controls is open.
    expect(document.querySelectorAll(".td-navbtn[data-nav]")).toHaveLength(0);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("carries no .is-open, so that runtime's close-all and Escape find nothing", async () => {
    const user = userEvent.setup();
    render(<Nav />);
    await user.click(screen.getByRole("button", { name: /Services/ }));
    const panel = document.getElementById("services-mega-panel") as HTMLElement;

    // The runtime strips `.is-open` from every `.td-mega-panel` on any outside
    // click, and only acts on Escape when it can find one. Visibility is keyed
    // off the component's own class instead, so both queries come back empty
    // and the sheet is invisible to it rather than fighting it.
    expect(panel).not.toHaveClass("is-open");
    expect(document.querySelectorAll(".td-mega-panel.is-open")).toHaveLength(0);
    expect(panel).toHaveClass("td-react-sitenav-panel");
  });

  it("gives every panel the same frame, so moving between menus does not resize the sheet", async () => {
    const user = userEvent.setup();
    render(<Nav />);

    await user.click(screen.getByRole("button", { name: /Services/ }));
    const first = document.getElementById("services-mega-panel") as HTMLElement;
    expect(first).toHaveClass("td-react-sitenav-panel");

    await user.click(screen.getByRole("button", { name: /Platforms/ }));
    const second = document.getElementById("platforms-mega-panel") as HTMLElement;
    expect(second).toHaveClass("td-react-sitenav-panel");
    expect(second.className).toBe(first.className);
  });

  it("closes on Escape and puts focus back on the trigger", async () => {
    const user = userEvent.setup();
    render(<Nav />);
    const trigger = screen.getByRole("button", { name: /Services/ });
    await user.click(trigger);

    await user.keyboard("{Escape}");

    expect(document.getElementById("services-mega-panel")).toBeNull();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("routes a flat link through renderLink when one is supplied", () => {
    render(
      <Nav
        items={[
          {
            kind: "link",
            label: "Work",
            href: "/case-studies",
            renderLink: ({ className, href, children }) => (
              <a className={className} href={href} data-router="true">{children}</a>
            ),
          },
        ]}
      />,
    );
    const link = screen.getByRole("link", { name: "Work" });
    expect(link).toHaveAttribute("data-router", "true");
    expect(link).toHaveClass("td-navbtn");
  });

  it("closes when a link inside the panel is followed, but not when a control is pressed", async () => {
    const user = userEvent.setup();
    render(
      <Nav
        items={[
          {
            kind: "menu",
            id: "services",
            label: "Services",
            title: "Services",
            content: (
              <>
                <button type="button">Show migrations</button>
                <a href="/services/migration">Migration services</a>
              </>
            ),
          },
        ]}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Services/ }));

    // A panel's own control swaps what the panel shows; it is not navigation.
    await user.click(screen.getByRole("button", { name: "Show migrations" }));
    expect(document.getElementById("services-mega-panel")).not.toBeNull();

    await user.click(screen.getByRole("link", { name: "Migration services" }));
    expect(document.getElementById("services-mega-panel")).toBeNull();
  });

  /*
   * The scrim, and the reason it is portalled.
   *
   * Measured on the production homepage at alpha.26: the scrim declared
   * `position: fixed; inset: 0` and rendered 86px tall — the height of the bar
   * — with `backdrop-filter` computing to `none`. The header carries the
   * retract transform, a transformed element is the containing block for its
   * fixed descendants and opens a new backdrop root, and the scrim was inside
   * it. Both reported symptoms, one cause.
   *
   * **jsdom performs no layout**, so `getBoundingClientRect()` is 0×0 for
   * every element and the geometry cannot be read off the rendered box here.
   * The two halves that produce that geometry are each checkable, so both are
   * asserted: the declared box below, and the containing block it resolves
   * against above. A test that checked only the declaration passed for the
   * whole life of this defect.
   */
  it("keeps the scrim's containing block the viewport while the header is mid-retract", async () => {
    const user = userEvent.setup();
    render(<Nav />);
    await user.click(screen.getByRole("button", { name: /Services/ }));

    const header = document.querySelector(".td-react-sitenav") as HTMLElement;
    // The measured state: partway through the retract transition, which is
    // where the transform is live and the containing block moves.
    header.style.transform = "matrix(1, 0, 0, 1, 0, -6.4)";

    const scrim = document.querySelector(".td-react-sitenav-scrim") as HTMLElement;
    expect(scrim).not.toBeNull();
    expect(header.contains(scrim)).toBe(false);
    expect(scrim.parentElement).toBe(document.body);
    expect(fixedContainingBlock(scrim)).toBeNull();
  });

  /*
   * The scrim, and the reason it is not simply portalled to `document.body`.
   *
   * `document.body` is right only while nothing between the header and the body
   * creates a stacking context. The moment something does, the whole component
   * is sealed inside it at that context's z-index and a body-level scrim paints
   * over the bar AND the open sheet, however high the header's own z-index is —
   * so the sheet is blurred and unclickable. Measured on the docs site, whose
   * specimen well raises itself to `z-index: 3` on `:focus-within`: that is,
   * on the very press that opens the menu.
   *
   * The scrim has to join that context. Ordering is then decided between
   * siblings by the z-indexes in the stylesheet, which is what they were
   * written to do.
   */
  it("portals the scrim into the stacking context the page seals the header inside", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <div style={{ position: "relative", zIndex: 3 }} data-testid="well">
        <Nav />
      </div>,
    );
    await user.click(screen.getByRole("button", { name: /Services/ }));

    const well = container.querySelector("[data-testid='well']") as HTMLElement;
    const scrim = document.querySelector(".td-react-sitenav-scrim") as HTMLElement;
    expect(scrim).not.toBeNull();
    // In the well, so the bar (59) and the sheet outrank it (30) inside the
    // one context. At `document.body` it would be a sibling of the well and
    // would cover everything in it.
    expect(scrim.parentElement).toBe(well);
    // Still out of the header, which is the other half of the contract.
    expect((document.querySelector(".td-react-sitenav") as HTMLElement).contains(scrim)).toBe(false);
    expect(fixedContainingBlock(scrim)).toBeNull();
  });

  it("escapes to the body when the enclosing context would break a fixed box", async () => {
    const user = userEvent.setup();
    render(
      <div style={{ transform: "translateZ(0)", position: "relative", zIndex: 3 }} data-testid="well">
        <Nav />
      </div>,
    );
    await user.click(screen.getByRole("button", { name: /Services/ }));

    // A transformed ancestor is the containing block for its fixed descendants
    // and opens a backdrop root, so joining it would resolve `inset: 0` against
    // the well and compute `backdrop-filter` to `none` — the original defect.
    // Escaping to the body is the better of two bad answers, and the only one
    // that leaves the glass working.
    const scrim = document.querySelector(".td-react-sitenav-scrim") as HTMLElement;
    expect(scrim.parentElement).toBe(document.body);
  });

  it("declares the scrim as a full-viewport fixed box in both distributions", () => {
    for (const [file, selector] of [
      ["site-navigation.css", ".td-react-sitenav-scrim"],
      ["../../../registry/tonaldepth/site-navigation.css", ".td-registry-sitenav-scrim"],
    ]) {
      const css = readFileSync(join(SRC, file), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
      const body = css.slice(css.indexOf(`${selector} {`)).slice(0, css.slice(css.indexOf(`${selector} {`)).indexOf("}"));
      expect(body, file).toMatch(/position:\s*fixed/);
      expect(body, file).toMatch(/inset:\s*0/);
    }
  });

  it("states its own anchor treatment, for a page that does not reset anchors", () => {
    /*
     * `.td-navbtn` and the brand slot were written for a page with a global
     * anchor reset, and a `kind: "link"` item is an `<a>`. Without this the bar
     * draws underlined links and hands the wordmark back in visited purple —
     * invisible on mith.tech, which has such a reset, and invisible on the docs
     * site, whose sidebar `nav a` rule was accidentally supplying one to every
     * `<nav>` on the page.
     */
    for (const [file, prefix] of [
      ["site-navigation.css", "td-react-sitenav"],
      ["../../../registry/tonaldepth/site-navigation.css", "td-registry-sitenav"],
    ]) {
      const css = readFileSync(join(SRC, file), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
      expect(css, file).toMatch(new RegExp(`a\\.${prefix}-link \\{[^}]*text-decoration:\\s*none`));
      expect(css, file).toMatch(new RegExp(`\\.${prefix}-brand a \\{[^}]*text-decoration:\\s*none`));
    }
  });

  it("closes the sheet when the scrim is pressed, though it is outside the header", async () => {
    const user = userEvent.setup();
    render(<Nav />);
    await user.click(screen.getByRole("button", { name: /Services/ }));

    // The outside-press handler measures against the header, and the scrim is
    // no longer inside it — so the portal must not turn the scrim into a
    // surface that swallows its own dismissal.
    await user.click(document.querySelector(".td-react-sitenav-scrim") as HTMLElement);
    expect(document.getElementById("services-mega-panel")).toBeNull();
  });

  /*
   * Per-menu sizing. Measured on the live homepage at 1440: three cascade
   * panels filled 79% of a 1396x608 plate and the six-card grid filled 42% —
   * six cards in the top third and void under them, which reads as though
   * something failed to load.
   */
  it("sizes each menu on its own, and defaults to what shipped", async () => {
    const user = userEvent.setup();
    render(
      <Nav
        items={[
          { kind: "menu", id: "cards", label: "Cards", title: "Cards", height: "fit", width: "content", content: <a href="/a">A</a> },
          { kind: "menu", id: "deep", label: "Deep", title: "Deep", content: <a href="/b">B</a> },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Cards/ }));
    const sized = document.getElementById("cards-mega-panel") as HTMLElement;
    expect(sized).toHaveAttribute("data-mega-width", "content");
    expect(sized).toHaveAttribute("data-mega-height", "fit");

    await user.click(screen.getByRole("button", { name: /Deep/ }));
    const plain = document.getElementById("deep-mega-panel") as HTMLElement;
    // A menu that says nothing is drawn exactly as it always was.
    expect(plain).toHaveAttribute("data-mega-width", "full");
    expect(plain).toHaveAttribute("data-mega-height", "tall");
  });

  it("refuses `fit` on a panel that repaints itself, in the stylesheet", () => {
    // A doc sentence was not enough: the docs' own preview put `fit` on a
    // cascade within a minute of the prop existing. MegaCascade and MegaTabs
    // mark themselves `data-mega-stateful`, and a panel holding one gets the
    // fixed sheet back however it was sized — because a sheet that changes
    // height as the reader moves down a rail is the failure the fixed size
    // exists to prevent, and THAT is what "one size its content fills" means.
    for (const [file, P] of [
      ["site-navigation.css", "react"],
      ["../../../registry/tonaldepth/site-navigation.css", "registry"],
    ]) {
      const css = readFileSync(join(SRC, file), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
      expect(css, file).toMatch(
        new RegExp(`\\[data-mega-height="fit"\\]:has\\(\\[data-mega-stateful\\]\\)[^{]*\\{[^}]*height: var\\(--td-${P}-sitenav-panel-h`),
      );
    }
  });

  it("puts a search slot in the panel head when a menu asks for one", async () => {
    const user = userEvent.setup();
    render(
      <Nav
        items={[
          { kind: "menu", id: "kb", label: "Knowledge", title: "Knowledge", search: <input aria-label="Search knowledge" />, content: <a href="/a">A</a> },
        ]}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Knowledge/ }));
    const panel = document.getElementById("kb-mega-panel") as HTMLElement;
    const field = within(panel).getByRole("textbox", { name: "Search knowledge" });
    // In the HEAD, beside the title — not floating in the content well.
    expect(field.closest(".td-mega-head")).not.toBeNull();
    expect(field.closest(".td-react-sitenav-search")).not.toBeNull();
  });

  it("publishes --nav-offset for the toolbars that position against it", () => {
    render(<Nav />);
    expect(document.documentElement.style.getPropertyValue("--nav-offset")).not.toBe("");
  });
});

/*
 * The drawer.
 *
 * The half that did not exist. Every consumer wrote its own — mith.tech's was
 * 205 lines with zero library imports, hand-writing `td-drawer`, the whole
 * `td-disclose*` family and `td-primary` + `td-lamp`, and driven end to end by
 * the vanilla runtime's `data-overlay-open` / `data-overlay-close`. The tests
 * below are that brief read back: same `items`, no `td-*` in the caller, and
 * nothing that needs `tonaldepth.js` to be on the page.
 */
const DRAWER_ITEMS: SiteNavigationItem[] = [
  {
    kind: "menu",
    id: "services",
    label: "Services",
    title: "Services",
    content: <span>the desktop panel</span>,
    sections: [
      { id: "implement", label: "Implement", links: [{ href: "/services/erpnext-implementation", title: "ERP implementation", detail: "ERPNext · Frappe" }] },
      { id: "migrate", label: "Migrate", links: [{ href: "/services/migration/tally-to-erpnext", title: "Tally to ERPNext" }] },
    ],
  },
  {
    kind: "menu",
    id: "platforms",
    label: "Platforms",
    title: "Platforms",
    content: <span>the desktop panel</span>,
    sections: [{ id: "stack", label: "The technology", links: [{ href: "/platforms/erpnext", title: "Frappe and ERPNext" }] }],
  },
  { kind: "link", label: "Work", href: "/case-studies" },
];

function Drawer(props: Partial<React.ComponentProps<typeof NavDrawer>> = {}) {
  const [open, setOpen] = useState(true);
  return <NavDrawer open={open} onOpenChange={setOpen} items={DRAWER_ITEMS} {...props} />;
}

describe("NavDrawer", () => {
  it("draws the bar's own items — a disclosure per menu, a row per flat link", async () => {
    const user = userEvent.setup();
    render(<Drawer />);

    // The same array the bar takes. Nothing here is a second declaration.
    const services = screen.getByRole("button", { name: "Services" });
    expect(services).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "Platforms" })).toBeInTheDocument();
    // A link opens nothing, so it is a row rather than a disclosure.
    expect(screen.getByRole("link", { name: "Work" })).toHaveAttribute("href", "/case-studies");
    expect(screen.queryByRole("button", { name: "Work" })).toBeNull();

    await user.click(services);
    expect(services).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /ERP implementation/ })).toHaveAttribute("href", "/services/erpnext-implementation");
  });

  it("keeps DOM order when a flat link sits between two menus", () => {
    render(
      <Drawer
        items={[
          DRAWER_ITEMS[0],
          { kind: "link", label: "Work", href: "/case-studies" },
          DRAWER_ITEMS[1],
        ]}
      />,
    );
    const nav = screen.getByRole("navigation", { name: "Site navigation" });
    const labels = [...nav.querySelectorAll(".td-react-faq-q, .td-react-navdrawer-row")].map(node => node.textContent);
    // A run of adjacent menus shares one Faq; a link ends the run and starts
    // the next one. Order has to survive that split.
    expect(labels).toEqual(["Services", "Work", "Platforms"]);
  });

  it("opens one menu at a time across the runs a flat link splits", async () => {
    const user = userEvent.setup();
    render(
      <Drawer
        items={[
          DRAWER_ITEMS[0],
          { kind: "link", label: "Work", href: "/case-studies" },
          DRAWER_ITEMS[1],
        ]}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Services" }));
    await user.click(screen.getByRole("button", { name: "Platforms" }));

    // Two separate Faqs, one `single`. Each is handed the same open array, so
    // it computes the next set globally rather than within its own view.
    expect(screen.getByRole("button", { name: "Services" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "Platforms" })).toHaveAttribute("aria-expanded", "true");
  });

  it("is a disclosure, not a stylesheet: no td-disclose anywhere in it", () => {
    render(<Drawer defaultOpen={["services"]} />);
    // The 205-line consumer drawer hand-wrote td-disclose, td-disclose-trigger,
    // td-disclose-panel, td-disclose-body and td-disclose-chevron, and needed
    // the vanilla runtime to animate them. This is `Faq` at the drawer's
    // measure — one disclosure implementation in the library, not two.
    expect(document.querySelectorAll("[class*='td-disclose']")).toHaveLength(0);
    expect(document.querySelector(".td-react-navdrawer .td-react-faq")).not.toBeNull();
    const trigger = screen.getByRole("button", { name: "Services" });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById(trigger.getAttribute("aria-controls") as string)).toHaveAttribute("role", "region");
  });

  it("needs nothing from the vanilla runtime — no data-overlay, no data-state", () => {
    render(<Drawer />);
    const sheet = document.querySelector(".td-react-navdrawer") as HTMLElement;
    /*
     * The consumer's drawer was opened by `data-overlay-open="mobile-nav"` and
     * closed by `data-overlay-close`, with the trap, the lock and the
     * disclosure animation all supplied by `tonaldepth.js`. That runtime's
     * close-all is unscoped: it already strips `.is-open` from React-owned mega
     * panels and clobbers `aria-expanded` through `[data-nav]`. Carrying none
     * of its attributes makes this sheet invisible to it rather than merely
     * resistant to it — and makes the drawer work with it absent, which is the
     * whole point.
     */
    expect(sheet.hasAttribute("data-overlay")).toBe(false);
    expect(sheet.hasAttribute("data-state")).toBe(false);
    expect(document.querySelectorAll("[data-overlay-close]")).toHaveLength(0);
    expect(document.querySelectorAll("[data-disclose-toggle]")).toHaveLength(0);
    expect(sheet).toHaveAttribute("aria-modal", "true");
  });

  it("portals to the body, so the header's retract transform cannot claim it", () => {
    render(
      <div style={{ transform: "translateY(-4px)" }} data-testid="retracting">
        <Drawer />
      </div>,
    );
    const sheet = document.querySelector(".td-react-navdrawer") as HTMLElement;
    // The natural place to write the drawer is inside SiteNavigation's
    // children, and the header carries the retract transform — which is the
    // containing block for its fixed descendants and a new backdrop root. In
    // place, the sheet's insets resolve against the 86px bar and the scrim's
    // glass computes to `none`. Both symptoms, one cause; see Overlays.
    expect(sheet.closest("[data-testid='retracting']")).toBeNull();
    expect(fixedContainingBlock(sheet)).toBeNull();
  });

  it("traps Tab inside the sheet and gives focus back on close", async () => {
    const user = userEvent.setup();
    function Host() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>Open navigation menu</button>
          <NavDrawer open={open} onOpenChange={setOpen} items={DRAWER_ITEMS} />
        </>
      );
    }
    render(<Host />);
    const burger = screen.getByRole("button", { name: "Open navigation menu" });
    await user.click(burger);

    // Lands on the first real control, not on the close button: dismiss is the
    // one thing always reachable, and opening a menu with the caret on "close"
    // asks the reader to tab past the exit to reach the first section.
    expect(screen.getByRole("button", { name: "Services" })).toHaveFocus();

    const sheet = document.querySelector(".td-react-navdrawer") as HTMLElement;
    const focusables = [...sheet.querySelectorAll<HTMLElement>("button,[href]")];
    focusables[focusables.length - 1].focus();
    await user.tab();
    expect(sheet.contains(document.activeElement)).toBe(true);

    await user.keyboard("{Escape}");
    expect(document.querySelector(".td-react-navdrawer")).toBeNull();
    expect(burger).toHaveFocus();
  });

  it("locks the page behind it and pays back the scrollbar's gutter", () => {
    const { rerender } = render(<NavDrawer open={false} onOpenChange={() => {}} items={DRAWER_ITEMS} />);
    expect(document.body.style.overflow).toBe("");

    rerender(<NavDrawer open onOpenChange={() => {}} items={DRAWER_ITEMS} />);
    expect(document.body.style.overflow).toBe("hidden");

    rerender(<NavDrawer open={false} onOpenChange={() => {}} items={DRAWER_ITEMS} />);
    // Restored to what the page had, not to a literal — a consumer may be
    // running a smooth-scroll library that owns `overflow` itself.
    expect(document.body.style.overflow).toBe("");
    expect(document.body.style.paddingRight).toBe("");
  });

  it("closes on the scrim, and on following a link, but not on pressing a disclosure", async () => {
    const user = userEvent.setup();
    render(<Drawer />);

    // A disclosure trigger is the drawer's own control, not navigation.
    await user.click(screen.getByRole("button", { name: "Services" }));
    expect(document.querySelector(".td-react-navdrawer")).not.toBeNull();

    await user.click(screen.getByRole("link", { name: /ERP implementation/ }));
    expect(document.querySelector(".td-react-navdrawer")).toBeNull();
  });

  it("dismisses on the scrim", async () => {
    const user = userEvent.setup();
    render(<Drawer />);
    await user.click(document.querySelector(".td-react-navdrawer-scrim") as HTMLElement);
    expect(document.querySelector(".td-react-navdrawer")).toBeNull();
  });

  it("routes every row through renderLink when one is supplied", () => {
    render(<Drawer defaultOpen={["services"]} renderLink={({ className, href, children }) => <a className={className} href={href} data-router="true">{children}</a>} />);
    expect(screen.getByRole("link", { name: /ERP implementation/ })).toHaveAttribute("data-router", "true");
    // The flat item's own renderLink wins where it has one; the drawer's is
    // the fallback, so a consumer supplies its router once.
    expect(screen.getByRole("link", { name: "Work" })).toHaveAttribute("data-router", "true");
  });

  it("drops a menu with no sections rather than pouring a desktop panel into it", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Drawer
        items={[{ kind: "menu", id: "industries", label: "Industries", title: "Industries", content: <a href="/industries">the desktop grid</a> }]}
      />,
    );
    /*
     * `content` is a ReactNode by design — the bar owns the sheet and owns
     * nothing about what is inside one — so the drawer cannot read a menu's
     * destinations out of it. Rendering it anyway is worse than it looks:
     * MegaCascade moves focus to its first category on mount, so a CLOSED
     * disclosure would steal the caret the moment the drawer opened. One
     * console line and one field beats a menu that half-works.
     */
    expect(screen.queryByRole("button", { name: "Industries" })).toBeNull();
    expect(screen.queryByRole("link", { name: "the desktop grid" })).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("industries"));
    warn.mockRestore();
  });

  it("takes MegaColumns' own sections array verbatim", () => {
    // Structurally the same record, so a consumer whose panel is MegaColumns
    // passes ONE array to the panel and to the menu. That is the whole of
    // "declared once" — the type is restated in site-navigation rather than
    // imported only so a registry item stays self-contained.
    const sections: MegaSection[] = [
      { id: "guides", label: "Guides", links: [{ href: "/learn/erpnext", title: "ERPNext guides", detail: "12 guides" }] },
    ];
    render(<Drawer items={[{ kind: "menu", id: "knowledge", label: "Knowledge", title: "Knowledge", content: <MegaColumns sections={sections} />, sections }]} defaultOpen={["knowledge"]} />);
    expect(screen.getAllByRole("link", { name: /ERPNext guides/ }).length).toBeGreaterThan(0);
  });

  it("derives those sections from a cascade's own groups", () => {
    const groups: MegaCascadeGroup[] = [
      {
        id: "implementation",
        label: "Implementation",
        branches: [
          { id: "erp", title: "ERP", href: "/services/erp", items: [{ href: "/services/erpnext-implementation", title: "ERPNext implementation", detail: "90 days" }] },
        ],
      },
    ];
    const sections = megaCascadeSections(groups);
    /*
     * A cascade becomes a FLAT LIST on a phone, not a drilldown. Level 1 is a
     * device for fitting depth into a sheet of fixed height; a drawer scrolls,
     * so the constraint that produced the rail is absent and reproducing it
     * would import its cost. Level 1 is therefore dropped rather than folded
     * into the labels, and a navigable branch keeps its `href` as the last row
     * — the only thing the flattening would otherwise lose.
     */
    expect(sections).toHaveLength(1);
    expect(sections[0].id).toBe("implementation-erp");
    expect(sections[0].label).toBe("ERP");
    expect(sections[0].links.map(link => link.title)).toEqual(["ERPNext implementation", "See all ERP"]);
  });
});

describe("SiteNavigation's small form", () => {
  it("renders no burger and hides nothing until it is given somewhere to send a reader", () => {
    render(<Nav />);
    const header = document.querySelector(".td-react-sitenav") as HTMLElement;
    // Additive: a consumer that passes nothing new renders exactly as before,
    // which is why the responsive rule is gated on the prop rather than
    // applied to every navigation.
    expect(header.hasAttribute("data-nav-compact")).toBe(false);
    expect(document.querySelector(".td-react-sitenav-burger")).toBeNull();
  });

  it("puts the burger in the bar itself, so no consumer writes a td-* class to place it", async () => {
    const user = userEvent.setup();
    const onMenuOpen = vi.fn();
    render(
      <SiteNavigation brand="TD" items={ITEMS} actions={<button type="button">Get an estimate</button>} onMenuOpen={onMenuOpen} />,
    );
    const header = document.querySelector(".td-react-sitenav") as HTMLElement;
    expect(header).toHaveAttribute("data-nav-compact", "");

    const burger = screen.getByRole("button", { name: "Open navigation menu" });
    expect(burger.closest(".td-nav-right")).not.toBeNull();
    await user.click(burger);
    expect(onMenuOpen).toHaveBeenCalledTimes(1);
  });

  it("gates the trigger row and the burger on the same attribute, in one stylesheet, in both distributions", () => {
    for (const [file, P] of [
      ["site-navigation.css", "react"],
      ["../../../registry/tonaldepth/site-navigation.css", "registry"],
    ]) {
      const css = readFileSync(join(SRC, file), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
      // The burger and the hidden trigger row are one decision. Split across
      // two rules with two conditions, a consumer ships a bar with both or
      // with neither — which is how `.td-nav-burger` came to be invented
      // downstream in the first place.
      expect(css, file).toMatch(new RegExp(`\\.td-${P}-sitenav\\[data-nav-compact\\] \\.td-navlinks \\{[^}]*display:\\s*none`));
      expect(css, file).toMatch(new RegExp(`\\.td-${P}-sitenav\\[data-nav-compact\\] \\.td-iconbtn\\.td-${P}-sitenav-burger \\{[^}]*display:\\s*grid`));
    }
  });

  it("beats the base layer's `display: none` on specificity, in both distributions", () => {
    for (const [file, P] of [
      ["nav-drawer.css", "react"],
      ["../../../registry/tonaldepth/nav-drawer.css", "registry"],
    ]) {
      const css = readFileSync(join(SRC, file), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
      // `.td-drawer` ships `display: none` with `[data-state="open"]` turning
      // it on — and `data-state` is exactly what the vanilla runtime writes
      // and strips. Winning on specificity instead keeps the sheet invisible
      // to that runtime, the same move the mega panel makes.
      expect(css, file).toMatch(new RegExp(`\\.td-drawer\\.td-${P}-navdrawer \\{[^}]*display:\\s*flex`));
    }
  });
});


/*
 * The bottom bar.
 *
 * The other place navigation lives on a phone: not the directory behind a
 * burger, but the three or four destinations a thumb reaches all day. The
 * base layer shipped `.td-bottomnav` with no component behind it — the same
 * gap `.td-drawer` had.
 */
const BOTTOM_ITEMS = [
  { id: "home", label: "Home", icon: <span>H</span>, href: "/", current: true },
  { id: "orders", label: "Orders", icon: <span>O</span>, href: "/orders", badge: 3 },
  { id: "alerts", label: "Alerts", icon: <span>A</span>, href: "/alerts" },
  { id: "support", label: "Support", icon: <span>S</span>, href: "/support" },
  { id: "settings", label: "Settings", icon: <span>G</span>, href: "/settings" },
  { id: "contact", label: "Contact", icon: <span>C</span>, href: "/contact" },
];

describe("BottomNav", () => {
  it("draws what fits and puts the rest behind More", async () => {
    const user = userEvent.setup();
    render(<BottomNav items={BOTTOM_ITEMS} placement="inline" />);

    // Four destinations plus More is five things on the bar. One slot goes to
    // More the moment anything overflows, so the bar never draws four
    // destinations AND More alongside a fifth.
    expect(screen.getByRole("link", { name: /Home/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Support/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Settings/ })).not.toBeInTheDocument();

    const more = screen.getByRole("button", { name: /More/ });
    expect(more).toHaveAttribute("aria-expanded", "false");
    await user.click(more);
    expect(more).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /Settings/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Contact/ })).toBeInTheDocument();
  });

  it("clamps `max` at five, whatever it is passed", () => {
    render(<BottomNav items={BOTTOM_ITEMS} max={12} placement="inline" />);
    /*
     * A 360px bar divided six ways gives each destination 56px, which is under
     * the tap minimum once the padding comes out and leaves no room for a word
     * under the icon. A bar you cannot hit is not a navigation, so the ceiling
     * is enforced rather than documented.
     */
    const bar = screen.getByRole("navigation", { name: "Primary" });
    expect(within(bar).getAllByRole("link")).toHaveLength(4);
    expect(within(bar).getByRole("button", { name: /More/ })).toBeInTheDocument();
  });

  it("draws no More at all when everything fits and nothing extra was given", () => {
    render(<BottomNav items={BOTTOM_ITEMS.slice(0, 3)} placement="inline" />);
    expect(screen.queryByRole("button", { name: /More/ })).not.toBeInTheDocument();
  });

  it("opens More for a caller's extra content even with nothing overflowing", async () => {
    const user = userEvent.setup();
    render(
      <BottomNav items={BOTTOM_ITEMS.slice(0, 3)} placement="inline">
        <button type="button">Sign out</button>
      </BottomNav>,
    );
    await user.click(screen.getByRole("button", { name: /More/ }));
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("takes the focus, returns it, and closes on Escape", async () => {
    const user = userEvent.setup();
    render(<BottomNav items={BOTTOM_ITEMS} placement="inline" />);
    const more = screen.getByRole("button", { name: /More/ });
    await user.click(more);

    // Expanding is not modal the way a dialog is — it is one level of a
    // navigation opening — but a panel over the page the keyboard cannot reach
    // or leave is worse than no panel.
    expect(screen.getByRole("dialog")).toContainElement(document.activeElement);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(more).toHaveFocus();
  });

  it("collapses when a destination in the sheet is followed", async () => {
    const user = userEvent.setup();
    render(<BottomNav items={BOTTOM_ITEMS} placement="inline" />);
    await user.click(screen.getByRole("button", { name: /More/ }));
    await user.click(screen.getByRole("link", { name: /Settings/ }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("portals the fixed bar out, so a transformed page cannot claim it", () => {
    render(
      <div style={{ transform: "translateY(-4px)" }} data-testid="animated">
        <BottomNav items={BOTTOM_ITEMS} />
      </div>,
    );
    // `position: fixed` resolves against the nearest transformed ancestor
    // rather than the viewport, so a bar rendered in place would pin itself to
    // that box instead of the screen — the defect the mega sheet's scrim
    // shipped with in 0.1.0-alpha.26.
    const bar = screen.getByRole("navigation", { name: "Primary" });
    expect(bar.closest("[data-testid='animated']")).toBeNull();
    expect(fixedContainingBlock(bar)).toBeNull();
  });

  it("publishes --bottom-nav-offset while it is pinned, and clears it when it is not", () => {
    const { unmount } = render(<BottomNav items={BOTTOM_ITEMS} />);
    // A fixed bar covers the end of every scroll; the offset is how a page
    // pads its last row clear of it.
    expect(document.documentElement.style.getPropertyValue("--bottom-nav-offset")).not.toBe("");
    unmount();
    expect(document.documentElement.style.getPropertyValue("--bottom-nav-offset")).toBe("");
  });

  it("routes every destination through renderLink when one is supplied", () => {
    render(
      <BottomNav
        items={BOTTOM_ITEMS}
        placement="inline"
        renderLink={({ className, href, children }) => <a className={className} href={href} data-router="true">{children}</a>}
      />,
    );
    expect(screen.getByRole("link", { name: /Home/ })).toHaveAttribute("data-router", "true");
  });
});

describe("Footer", () => {
  it("routes every column link through renderLink", () => {
    render(
      <Footer>
        <FooterGrid>
          <FooterColumn
            title="Services"
            links={LINKS}
            renderLink={({ href, children }) => <a href={href} data-router="true">{children}</a>}
          />
        </FooterGrid>
      </Footer>,
    );
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    for (const link of links) expect(link).toHaveAttribute("data-router", "true");
  });

  it("names the column with a heading the design system styles", () => {
    render(
      <Footer>
        <FooterGrid>
          <FooterColumn title="Services" links={LINKS} />
        </FooterGrid>
      </Footer>,
    );
    const heading = screen.getByRole("heading", { name: "Services" });
    expect(heading.tagName).toBe("H5");
    expect(heading.parentElement).toHaveClass("td-footer-col");
  });

  it("pairs each contact channel with its value", () => {
    render(
      <Footer>
        <FooterContact
          items={[
            { key: "Email", value: <a href="mailto:hello@mith.tech">hello@mith.tech</a> },
            { key: "Office", value: <span className="td-footer-addr">Bengaluru</span> },
          ]}
        />
      </Footer>,
    );
    expect(screen.getByText("Contact")).toHaveClass("td-footer-contactwell-label");
    expect(screen.getByText("Email")).toHaveClass("td-footer-contactitem-k");
    expect(screen.getByRole("link", { name: "hello@mith.tech" })).toBeInTheDocument();
  });

  it("is one landmark carrying the brand, the columns and the bottom rule", async () => {
    const { container } = render(
      <Footer>
        <FooterGrid>
          <FooterBrand name="MITH.TECH" href="/">
            The practice that implements and operates open-source infrastructure.
          </FooterBrand>
          <FooterColumn title="Services" links={LINKS} />
        </FooterGrid>
        <FooterContact items={[{ key: "Email", value: <a href="mailto:hello@mith.tech">hello@mith.tech</a> }]} />
        <FooterBottom
          note="© 2026 Mithtech Innovative Solutions Private Limited"
          social={<FooterSocial label="Social profiles"><a className="td-glowicon" href="https://example.com" aria-label="LinkedIn">in</a></FooterSocial>}
          links={[{ href: "/privacy", label: "Privacy" }]}
        />
      </Footer>,
    );
    expect(screen.getByRole("contentinfo")).toHaveClass("td-footer");
    expect(screen.getByRole("link", { name: "MITH.TECH" })).toHaveAttribute("href", "/");

    const result = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(result.violations.filter(item => item.impact === "critical" || item.impact === "serious")).toEqual([]);
  });
});

/*
 * The window actions.
 *
 * The half nothing drew. Every consumer that needed the three lights wrote its
 * own — its own maximise glyph out of whatever icon set was to hand, its own
 * three hex values off a screenshot — because the library exposed neither the
 * cluster nor a plain Maximize mark. The tests below are that brief read back:
 * three real buttons with real names, a silhouette that does not reflow, and
 * marks that arrive on the cluster rather than on the disc under the pointer.
 */
describe("WindowControls", () => {
  it("draws three named buttons in the platform's order", () => {
    render(<WindowControls onClose={() => {}} onMinimise={() => {}} onMaximise={() => {}} />);
    const group = screen.getByRole("group", { name: "Window controls" });
    const names = within(group).getAllByRole("button").map(button => button.getAttribute("aria-label"));
    // Left to right, and named — the colour is never the only thing saying
    // which disc is which.
    expect(names).toEqual(["Close", "Minimise", "Maximise"]);
  });

  it("runs the action the disc names", async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    render(
      <WindowControls
        onClose={() => calls.push("close")}
        onMinimise={() => calls.push("minimise")}
        onMaximise={() => calls.push("maximise")}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Maximise" }));
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(calls).toEqual(["maximise", "close"]);
  });

  it("disables an action with no handler rather than dropping its disc", () => {
    /* The cluster is recognised by its silhouette, and a row that is sometimes
       two wide and sometimes three reflows the title beside it. Every platform
       greys the light instead. */
    render(<WindowControls onClose={() => {}} />);
    expect(screen.getAllByRole("button")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Close" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Minimise" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Maximise" })).toBeDisabled();
  });

  it("reports focus on the cluster, because focus belongs to the window", () => {
    const { rerender } = render(<WindowControls onClose={() => {}} />);
    expect(screen.getByRole("group")).toHaveAttribute("data-focused", "true");
    rerender(<WindowControls onClose={() => {}} focused={false} />);
    expect(screen.getByRole("group")).toHaveAttribute("data-focused", "false");
  });

  it("takes the size and the labels from the caller", () => {
    render(
      <WindowControls
        size="sm"
        label="Preview window"
        labels={{ close: "Fermer", minimise: "Réduire", maximise: "Agrandir" }}
        onClose={() => {}}
      />,
    );
    const group = screen.getByRole("group", { name: "Preview window" });
    expect(group).toHaveClass("td-react-windowcontrols--sm");
    expect(within(group).getByRole("button", { name: "Fermer" })).toBeInTheDocument();
  });

  it("gives each disc a mark, hidden from the accessibility tree", () => {
    /* The marks are the hover affordance, not the name — a screen reader hears
       "Close", not a cross. And they must be real glyphs: Phosphor's `X` and
       `Minus` at `fill` are square plates with the mark knocked out, which at
       6px is a filled square. */
    const { container } = render(<WindowControls onClose={() => {}} onMinimise={() => {}} onMaximise={() => {}} />);
    const marks = [...container.querySelectorAll(".td-react-windowcontrols-mark")];
    expect(marks).toHaveLength(3);
    for (const mark of marks) {
      expect(mark).toHaveAttribute("aria-hidden", "true");
      expect(mark.querySelector("svg")).not.toBeNull();
    }
  });

  it("passes an accessibility audit", async () => {
    const { container } = render(
      <WindowControls onClose={() => {}} onMinimise={() => {}} onMaximise={() => {}} />,
    );
    const result = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(result.violations.filter(item => item.impact === "critical" || item.impact === "serious")).toEqual([]);
  });
});
