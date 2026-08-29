import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import axe from "axe-core";
import { Footer, FooterBottom, FooterBrand, FooterColumn, FooterContact, FooterGrid, FooterSocial, SiteNavigation, type SiteNavigationItem } from "./index";

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
