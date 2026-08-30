import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import {
  Alert, Button, Checkbox, Dialog, DropdownMenu, Radio, RadioGroup, Switch, Table, TableBody, TableCell,
  TableContainer, TableHead, TableHeader, TableRow, Tabs, ToastProvider, Tooltip, useToast,
} from "./index";
import { Badge, IconButton, ThemeToggle } from "./index";
import { FilamentButton, FooterBottom, FooterColumn, SearchBar, SideTabs, SiteNavigation, SplitButton } from "./index";
import { AcceptIcon, CancelIcon, CloseIcon, StarIcon, SuccessIcon, WhatsAppIcon, LAMP_WEIGHT, TD_ICON_ROLES } from "./index";

describe("selection controls", () => {
  it("uses native checkbox, radio, and switch behavior", async () => {
    const user = userEvent.setup();
    render(<><Checkbox label="Reports" /><RadioGroup legend="Plan" name="plan"><Radio label="Basic" value="basic" /><Radio label="Pro" value="pro" /></RadioGroup><Switch label="Notifications" /></>);
    const checkbox = screen.getByRole("checkbox", { name: "Reports" });
    const pro = screen.getByRole("radio", { name: "Pro" });
    const toggle = screen.getByRole("switch", { name: "Notifications" });
    await user.click(checkbox); await user.click(pro); await user.click(toggle);
    expect(checkbox).toBeChecked(); expect(pro).toBeChecked(); expect(toggle).toBeChecked();
  });
});

describe("tabs", () => {
  it("supports click and arrow-key activation", async () => {
    const user = userEvent.setup();
    render(<Tabs items={[{ value: "one", label: "Overview", content: "First panel" }, { value: "two", label: "Details", content: "Second panel" }]} />);
    const overview = screen.getByRole("tab", { name: "Overview" });
    overview.focus(); await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Details" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Second panel");
  });
});

describe("overlays", () => {
  it("connects tooltip description", () => {
    render(<Tooltip content="Helpful detail"><Button>Help</Button></Tooltip>);
    expect(screen.getByRole("button", { name: "Help" })).toHaveAccessibleDescription("Helpful detail");
  });

  it("closes dialog on Escape and restores trigger focus", async () => {
    const user = userEvent.setup();
    function Example() { const [open, setOpen] = useState(false); return <><Button onClick={() => setOpen(true)}>Open</Button><Dialog open={open} onOpenChange={setOpen} title="Confirm"><Button onClick={() => setOpen(false)}>Done</Button></Dialog></>; }
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Open" });
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Confirm" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
  });

  it("navigates dropdown items and selects a value", async () => {
    const user = userEvent.setup();
    let selected = "";
    render(<DropdownMenu label="Choose plan" value={selected} onValueChange={value => { selected = value; }} items={[{ value: "basic", label: "Basic" }, { value: "pro", label: "Pro" }]} />);
    const trigger = screen.getByRole("button", { name: "Choose plan" });
    await user.click(trigger);
    expect(screen.getByRole("menuitemradio", { name: "Basic" })).toHaveFocus();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(selected).toBe("pro");
    expect(trigger).toHaveFocus();
  });
});

describe("feedback and data", () => {
  it("dismisses alerts", async () => {
    const user = userEvent.setup(); let dismissed = false;
    render(<Alert title="Update available" onDismiss={() => { dismissed = true; }}>Restart later</Alert>);
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(dismissed).toBe(true);
  });

  it("announces and dismisses toasts", async () => {
    const user = userEvent.setup();
    function Trigger() { const { toast } = useToast(); return <Button onClick={() => toast({ title: "Saved", variant: "success", duration: 0 })}>Notify</Button>; }
    render(<ToastProvider><Trigger /></ToastProvider>);
    await user.click(screen.getByRole("button", { name: "Notify" }));
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
    await user.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
  });

  it("renders semantic table primitives", () => {
    render(<TableContainer><Table><TableHead><TableRow><TableHeader>Name</TableHeader></TableRow></TableHead><TableBody><TableRow><TableCell>Ada</TableCell></TableRow></TableBody></Table></TableContainer>);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute("scope", "col");
    expect(screen.getByRole("cell", { name: "Ada" })).toBeInTheDocument();
  });

  it("has no critical or serious automated accessibility violations", async () => {
    render(<main><Alert title="Information">Details</Alert><Tabs items={[{ value: "one", label: "One", content: "Panel" }]} /><TableContainer><Table><TableHead><TableRow><TableHeader>Item</TableHeader></TableRow></TableHead><TableBody><TableRow><TableCell>Value</TableCell></TableRow></TableBody></Table></TableContainer></main>);
    const result = await axe.run(document.body, { rules: { "color-contrast": { enabled: false } } });
    expect(result.violations.filter(item => item.impact === "critical" || item.impact === "serious")).toEqual([]);
  });
});

const LAMP = <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /></svg>;

describe("the lamp", () => {
  it("names an icon-only lamp by its aria-label and hides the glyph", () => {
    render(<IconButton icon={LAMP} aria-label="Play" />);
    const button = screen.getByRole("button", { name: "Play" });
    expect(button).toHaveClass("td-glowicon");
    expect(button).not.toHaveClass("td-glowicon--text");
    expect(button.querySelector(".td-react-iconbutton-lamp")).toHaveAttribute("aria-hidden", "true");
  });

  it("takes its accessible name from the label when there is one", () => {
    render(<IconButton icon={LAMP} label="Message us" tone="whatsapp" />);
    const button = screen.getByRole("button", { name: "Message us" });
    expect(button).toHaveClass("td-glowicon--text");
    expect(button).toHaveClass("td-glowicon--wa");
    // The label is its own element so its ink can be held while the lamp ramps.
    expect(button.querySelector(".td-glowicon-label")).toHaveTextContent("Message us");
  });

  it("warns when an icon-only lamp would reach a screen reader unnamed", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<IconButton icon={LAMP} />);
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it("renders an anchor when given an href, so a social link is a link", () => {
    render(<IconButton icon={LAMP} href="https://example.com" aria-label="LinkedIn" tone="linkedin" />);
    const link = screen.getByRole("link", { name: "LinkedIn" });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveClass("td-glowicon--li");
  });

  it("wraps a Button's leading icon as a lamp and leaves the label alone", () => {
    render(<Button leading={LAMP}>Book a call</Button>);
    const button = screen.getByRole("button", { name: "Book a call" });
    const lamp = button.querySelector(".td-react-button-lamp");
    expect(lamp).not.toBeNull();
    expect(lamp).toHaveAttribute("aria-hidden", "true");
    // The label keeps its own element, untouched by the lamp's colour ramp.
    expect(button.querySelector(".td-primary-label")).toHaveTextContent("Book a call");
  });

  it("drops the lamp while loading so the spinner is the only mark", () => {
    render(<Button leading={LAMP} loading>Save</Button>);
    const button = screen.getByRole("button");
    expect(button.querySelector(".td-react-button-lamp")).toBeNull();
    expect(button.querySelector(".td-react-spinner")).not.toBeNull();
  });
});

describe("inline controls size to their content", () => {
  // A grid item blockifies an inline-level box to `flex` and then stretches it
  // to the whole track, which is how a Button and a Badge came to span the full
  // width of any `display: grid` panel they were dropped into.
  it("marks Button and Badge with the class that pins them to fit-content", () => {
    render(<><Button>Open dialog</Button><Badge variant="brand">TonalDepth UI</Badge></>);
    expect(screen.getByRole("button", { name: "Open dialog" })).toHaveClass("td-react-button");
    expect(screen.getByText("TonalDepth UI")).toHaveClass("td-react-badge");
  });
});

describe("semantic button variants", () => {
  it("fills accept, cancel and whatsapp and gives each a white label", () => {
    render(<><Button variant="accept">Approve</Button><Button variant="cancel">Cancel</Button><Button variant="whatsapp">WhatsApp us</Button></>);
    for (const [name, variant] of [["Approve","accept"],["Cancel","cancel"],["WhatsApp us","whatsapp"]] as const) {
      const b = screen.getByRole("button", { name });
      expect(b).toHaveClass("td-coloured");
      expect(b).toHaveClass(`td-react-button--${variant}`);
      // A filled housing carries the coloured-label contract, not the surface one.
      expect(b.querySelector(".td-coloured-label")).toHaveTextContent(name);
    }
  });

  it("ships a default mark with each semantic variant, and lets leading replace it", () => {
    const { rerender } = render(<Button variant="accept">Approve</Button>);
    expect(screen.getByRole("button").querySelector(".td-react-button-lamp svg")).not.toBeNull();
    rerender(<Button variant="accept" leading={<svg data-testid="mine" />}>Approve</Button>);
    expect(screen.getByTestId("mine")).toBeInTheDocument();
  });

  it("keeps destructive on the papaya fill rather than the old dark error red", () => {
    render(<Button variant="destructive">Delete</Button>);
    const b = screen.getByRole("button", { name: "Delete" });
    expect(b).toHaveClass("td-coloured");
    expect(b.querySelector(".td-coloured-label")).toHaveTextContent("Delete");
  });

  it("adds the status lamp only when asked", () => {
    const { rerender } = render(<Button>Live feed</Button>);
    expect(screen.getByRole("button").querySelector(".td-lamp")).toBeNull();
    rerender(<Button dot>Live feed</Button>);
    const lamp = screen.getByRole("button").querySelector(".td-lamp");
    expect(lamp).not.toBeNull();
    expect(lamp).toHaveAttribute("aria-hidden", "true");
  });
});

describe("the icon set", () => {
  const svgOf = (element: Element | null) => element?.querySelector("svg") ?? null;
  /** A glyph's identity is its path data — which mark rendered, not which component. */
  const shapeOf = (svg: SVGSVGElement | null) =>
    [...(svg?.querySelectorAll("path") ?? [])].map(path => path.getAttribute("d")).join("|");

  it("draws the TD glyphs with no colour of their own", () => {
    render(<span data-testid="td"><AcceptIcon weight={LAMP_WEIGHT} /><CancelIcon weight={LAMP_WEIGHT} /><CloseIcon weight={LAMP_WEIGHT} /><StarIcon weight={LAMP_WEIGHT} /><WhatsAppIcon weight={LAMP_WEIGHT} /></span>);
    const glyphs = [...screen.getByTestId("td").querySelectorAll("svg")];
    expect(glyphs).toHaveLength(TD_ICON_ROLES.length);
    for (const glyph of glyphs) {
      // Downloaded artwork ships its fill baked in. A glyph that keeps it
      // cannot be moved by the lamp ramp and inverts wrongly on theme change.
      expect(glyph.getAttribute("fill")).toBe("currentColor");
      expect(glyph.outerHTML).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i);
      // `weight` is Phosphor's prop, and not an SVG attribute. A TD glyph
      // swallows it rather than putting an unknown one on the DOM node.
      expect(glyph.hasAttribute("weight")).toBe(false);
    }
  });

  it("moves accept to the TD tick while the checkbox keeps the circled check", () => {
    render(<><Button variant="accept">Approve</Button><Checkbox label="Reports" /><span data-testid="success"><SuccessIcon weight={LAMP_WEIGHT} /></span></>);
    const accept = shapeOf(svgOf(screen.getByRole("button", { name: "Approve" }).querySelector(".td-react-button-lamp")));
    const checkbox = shapeOf(svgOf(screen.getByRole("checkbox", { name: "Reports" }).closest("label")));
    expect(accept).not.toBe("");
    expect(accept).not.toBe(checkbox);
    // Being ticked is a state and approving is an act, so they stopped sharing
    // a mark — the box keeps the circled check a success report also uses.
    expect(checkbox).toBe(shapeOf(svgOf(screen.getByTestId("success"))));
  });

  it("gives cancel a mark of its own instead of reusing close", () => {
    render(<><Button variant="cancel">Cancel</Button><span data-testid="close"><CloseIcon weight={LAMP_WEIGHT} /></span></>);
    const cancel = shapeOf(svgOf(screen.getByRole("button", { name: "Cancel" }).querySelector(".td-react-button-lamp")));
    expect(cancel).not.toBe("");
    expect(cancel).not.toBe(shapeOf(svgOf(screen.getByTestId("close"))));
  });
});

describe("theme toggle", () => {
  it("names itself by the theme the press switches to, in both shapes", async () => {
    const user = userEvent.setup();
    document.documentElement.setAttribute("data-theme", "light");
    render(<ThemeToggle showLabel />);
    const button = screen.getByRole("button", { name: "Switch to dark theme" });
    // The visible pill text is short; the accessible name stays the sentence.
    expect(button).toHaveClass("td-react-theme-toggle--text");
    expect(button.querySelector(".td-react-theme-toggle-label")).toHaveTextContent("Dark mode");
    await user.click(button);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(button.querySelector(".td-react-theme-toggle-label")).toHaveTextContent("Light mode");
  });

  it("follows a theme change made somewhere other than this button", async () => {
    document.documentElement.setAttribute("data-theme", "light");
    // storageKey={null} so a stored choice from an earlier test cannot decide
    // the initial theme — this test is about following the DOM, not storage.
    render(<ThemeToggle showLabel storageKey={null} />);
    const button = screen.getByRole("button");
    expect(button.querySelector(".td-react-theme-toggle-label")).toHaveTextContent("Dark mode");
    // A second toggle, or the app's settings screen, writes the attribute.
    document.documentElement.setAttribute("data-theme", "dark");
    await waitFor(() =>
      expect(button.querySelector(".td-react-theme-toggle-label")).toHaveTextContent("Light mode"));
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("stays a round icon button when unlabelled", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button).not.toHaveClass("td-react-theme-toggle--text");
    expect(button.querySelector(".td-react-theme-toggle-label")).toBeNull();
  });
});

describe("filament, tabs, split and search", () => {
  const ICON = <svg data-testid="glyph" viewBox="0 0 16 16"><path d="M2 2h12v12H2Z" /></svg>;

  it("reports the held state to a screen reader, not only with light", () => {
    render(<FilamentButton label="Overview" icon={ICON} active />);
    const button = screen.getByRole("button", { name: "Overview" });
    // The lit filament is the visual half. Without aria-pressed the fourth
    // state exists only for people who can see the strip.
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button).toHaveClass("td-react-filament--on");
  });

  it("keeps hover, held and press as three distinguishable steps", () => {
    render(<FilamentButton label="Tab" active tone="brand" />);
    const button = screen.getByRole("button", { name: "Tab" });
    expect(button).toHaveClass("td-react-filament--brand");
    // Rest is off. A tone class must never imply the filament is lit, or the
    // ladder collapses to "coloured vs not".
    render(<FilamentButton label="Off" tone="brand" />);
    expect(screen.getByRole("button", { name: "Off" })).not.toHaveClass("td-react-filament--on");
  });

  it("takes a custom glow colour without leaving the ladder", () => {
    render(<FilamentButton label="Custom" glow="#C79600" />);
    expect(screen.getByRole("button", { name: "Custom" }).style.getPropertyValue("--td-filament-ink")).toBe("#C79600");
  });

  it("names a rail tab that has no visible label", () => {
    render(<SideTabs layout="rail" label="Sections" items={[{ id: "a", label: "Overview", icon: ICON }, { id: "b", label: "Settings", icon: ICON }]} />);
    expect(screen.getByRole("tab", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Settings" })).toBeInTheDocument();
  });

  it("moves selection with the arrows and skips a disabled tab", async () => {
    const user = userEvent.setup();
    render(<SideTabs label="Sections" items={[
      { id: "a", label: "One", panel: <p>First</p> },
      { id: "b", label: "Two", disabled: true, panel: <p>Second</p> },
      { id: "c", label: "Three", panel: <p>Third</p> },
    ]} />);
    await user.click(screen.getByRole("tab", { name: "One" }));
    await user.keyboard("{ArrowDown}");
    // Two is disabled, so the arrow lands on Three rather than stopping dead.
    expect(screen.getByRole("tab", { name: "Three" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Third");
  });

  it("leaves the split button inert until a channel is chosen, when there is no default", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<SplitButton placeholder="Contact us via…" onAction={onAction} actions={[
      { id: "call", label: "Call" }, { id: "email", label: "Email" },
    ]} />);
    expect(screen.getByRole("button", { name: "Contact us via…" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "More options" }));
    await user.click(screen.getByRole("menuitem", { name: "Email" }));
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ id: "email" }));
    expect(screen.getByRole("button", { name: "Email" })).toBeEnabled();
  });

  it("acts at once when defaultAction is any, taking the first enabled action", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<SplitButton defaultAction="any" onAction={onAction} actions={[
      { id: "whatsapp", label: "WhatsApp", disabled: true },
      { id: "call", label: "Call" },
    ]} />);
    // "any" must skip the disabled action rather than defaulting to a control
    // the reader cannot use.
    await user.click(screen.getByRole("button", { name: "Call" }));
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ id: "call" }));
  });

  it("keeps the typed query when Escape closes the suggestion list", async () => {
    const user = userEvent.setup();
    render(<SearchBar defaultValue="" suggestions={[{ id: "erpnext", label: "ERPNext" }]} />);
    const field = screen.getByRole("combobox");
    await user.type(field, "erp");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    // Escape dismisses the list, never the work.
    expect(field).toHaveValue("erp");
  });
});

describe("SearchBar, as a trigger", () => {
  it("is a button rather than a field, so nothing can be typed into it", async () => {
    const onClick = vi.fn();
    render(<SearchBar trigger placeholder="Search components" onClick={onClick} />);
    const button = screen.getByRole("button", { name: /Search components/ });
    expect(button).toHaveAttribute("type", "button");
    // A field here would be a second place to type, and the narrower-looking
    // one always reads as searching less.
    expect(screen.queryByRole("searchbox")).toBeNull();
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("shows the shortcut as a hint, and drops it when asked", () => {
    const { unmount } = render(<SearchBar trigger placeholder="Search" />);
    // jsdom's UA is not a Mac, so the effect resolves to the other form. Either
    // way it is a hint — binding the key is the consumer's, because only they
    // know what it opens.
    expect(screen.getByRole("button").textContent).toMatch(/⌘K|Ctrl K/);
    unmount();

    render(<SearchBar trigger placeholder="Search" shortcut={false} />);
    expect(screen.getByRole("button").textContent).not.toMatch(/⌘K|Ctrl K/);
  });

  it("keeps the field's housing and mark, so it is not a second kind of search field", () => {
    const { container } = render(<SearchBar trigger size="sm" placeholder="Search" />);
    expect(container.querySelector(".td-react-search-field")).not.toBeNull();
    expect(container.querySelector(".td-react-search-mark svg")).not.toBeNull();
    expect(container.querySelector(".td-react-search--sm")).not.toBeNull();
  });
});

describe("SearchBar's suggestion panel", () => {
  it("is the field continuing rather than a card floating near it", async () => {
    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "search-bar.css"), "utf8");
    // Flush against the field, square where they meet, rounded only where the
    // pair ends. It sat at `calc(100% + sp-4)` with every corner rounded, which
    // reads as two objects.
    expect(css).toMatch(/\.td-react-search-list \{[^}]*top: 100%/);
    expect(css).toMatch(/\.td-react-search-list \{[^}]*border-start-start-radius: 0/);
    expect(css).toMatch(/\.td-react-search\[data-open\] \.td-react-search-field \{[^}]*border-end-start-radius: 0/);
    // It unfolds rather than appearing, and stops appearing under reduced motion.
    expect(css).toMatch(/@keyframes td-react-search-unfold/);
    expect(css).toMatch(/prefers-reduced-motion[\s\S]*?\.td-react-search-list \{ animation: none/);
  });

  it("marks the field open only while the list is actually down", async () => {
    const { container } = render(<SearchBar suggestions={[{ id: "a", label: "Alpha" }]} />);
    const form = container.querySelector(".td-react-search")!;
    expect(form).not.toHaveAttribute("data-open");
    await userEvent.type(screen.getByRole("combobox"), "a");
    expect(form).toHaveAttribute("data-open");
  });
});

describe("links are keyed by more than their href", () => {
  /* An href is not unique. Two links to the same place under different words is
     ordinary in a nav — "Docs" beside "Read the docs", a footer that repeats a
     legal page — and React reconciles a duplicate key into one element, so the
     second link silently stops updating. It surfaced as a console error on the
     docs' own SiteNavigation and Footer previews. */
  it("renders every link when two of them point at the same place", () => {
    const twice = [
      { kind: "link" as const, label: "Docs", href: "/docs" },
      { kind: "link" as const, label: "Read the docs", href: "/docs" },
    ];
    render(<SiteNavigation brand="TD" items={twice} />);
    expect(screen.getByRole("link", { name: "Docs" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Read the docs" })).toBeInTheDocument();
  });

  it("does the same in a footer column and in the bottom bar", () => {
    const twice = [
      { label: "Privacy", href: "/legal" },
      { label: "Legal", href: "/legal" },
    ];
    const { unmount } = render(<FooterColumn title="Company" links={twice} />);
    expect(screen.getByRole("link", { name: "Privacy" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Legal" })).toBeInTheDocument();
    unmount();

    render(<FooterBottom links={twice} />);
    expect(screen.getByRole("link", { name: "Privacy" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Legal" })).toBeInTheDocument();
  });
});
