import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import axe from "axe-core";
import { Footer, FooterBottom, FooterBrand, FooterColumn, FooterContact, FooterGrid, FooterSocial, SiteNavigation, type SiteNavigationItem } from "./index";

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
