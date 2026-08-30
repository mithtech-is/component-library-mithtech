/**
 * The last three: the secondary header, the chat launcher and the AI halo,
 * plus the two things Spotlight was missing, and the social button.
 *
 * Each is tested on the contract its docs entry states — what it does, what it
 * deliberately does NOT do, and the design law it was built against. The
 * "deliberately does not" half matters most here: two of these three are
 * defined by what they refuse to be (PageNav is not Tabs, ChatLauncher is not
 * a Dialog), and a test that only proves they render would not notice either
 * one drifting into its neighbour.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AiHalo, ChatLauncher, PageNav, SocialButton, Spotlight } from "./index";

const SRC = dirname(fileURLToPath(import.meta.url));
const read = (name: string) => readFileSync(join(SRC, name), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

describe("PageNav", () => {
  const ITEMS = [
    { label: "Overview", href: "/e/1", current: true },
    { label: "Milestones", href: "/e/1/m", count: 12 },
    { label: "Archive", href: "/e/1/a", disabled: true },
  ];

  it("navigates rather than switching a panel, and the router owns which is current", () => {
    render(<PageNav label="Sections" title="Commercely" items={ITEMS} />);
    const nav = screen.getByRole("navigation", { name: "Sections" });
    expect(nav).toBeInTheDocument();
    // Links, not tabs: there is no tablist and no panel.
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.getByRole("link", { name: /Overview/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Milestones/ })).toHaveAttribute("href", "/e/1/m");
  });

  it("keeps a disabled section out of the tab order rather than linking it", () => {
    render(<PageNav items={ITEMS} />);
    expect(screen.queryByRole("link", { name: /Archive/ })).toBeNull();
    expect(screen.getByText("Archive")).toBeInTheDocument();
  });

  it("stacks on --nav-offset instead of measuring the header", () => {
    // Neither bar has to know the other's height, and a retracting header does
    // not drag this out of place.
    const css = read("page-nav.css");
    expect(css).toMatch(/\.td-react-pagenav--sticky \{[^}]*top: calc\(var\(--nav-offset/);
  });

  it("scrolls its tabs rather than wrapping them onto a second line", () => {
    // A secondary header that grows to two lines pushes the page down every
    // time the section changes, and the reader loses their place.
    const css = read("page-nav.css");
    const scroll = /\.td-react-pagenav-scroll \{([^}]*)\}/.exec(css)!;
    expect(scroll[1]).toMatch(/overflow-x: auto/);
    expect(scroll[1]).toMatch(/min-width: 0/);
    expect(scroll[1]).toMatch(/mask-image/);
    expect(css).not.toMatch(/flex-wrap:\s*wrap/);
  });

  it("presses its tabs on the shared ladder and rests the current one recessed", () => {
    const css = read("page-nav.css");
    expect(css).toMatch(/a\.td-react-pagenav-tab:hover \{[^}]*box-shadow: var\(--td-row-hover\)/);
    expect(css).toMatch(/a\.td-react-pagenav-tab:active \{[^}]*box-shadow: var\(--td-row-press\)/);
    const current = /\.td-react-pagenav-tab\[aria-current="page"\] \{([^}]*)\}/.exec(css)!;
    expect(current[1]).toMatch(/box-shadow: var\(--td-row-selected\)/);
    expect(current[1]).toMatch(/color: var\(--td-brand-text\)/);
  });
});

describe("ChatLauncher", () => {
  it("opens and closes without taking the page", async () => {
    // Not a Dialog: no scrim, no focus trap, no aria-modal. The reader keeps
    // reading and the conversation waits.
    const { container } = render(<ChatLauncher title="Chat with us">Hello</ChatLauncher>);
    const launcher = screen.getByRole("button", { name: /Chat with us/ });
    expect(launcher).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(launcher);
    expect(launcher).toHaveAttribute("aria-expanded", "true");
    expect(container.querySelector('[aria-modal="true"]')).toBeNull();
    expect(container.querySelector(".td-react-chat-panel")).not.toHaveAttribute("hidden");
  });

  it("closes on Escape and hands focus back to the launcher", async () => {
    render(<ChatLauncher defaultOpen title="Chat with us">Hello</ChatLauncher>);
    await userEvent.keyboard("{Escape}");
    const launcher = screen.getByRole("button", { name: /Chat with us/ });
    expect(launcher).toHaveAttribute("aria-expanded", "false");
    expect(launcher).toHaveFocus();
  });

  it("puts the presence in text, not only in the light", () => {
    // A status carried by colour alone is a status half the readers cannot read.
    const { container, rerender } = render(<ChatLauncher presence="offline" />);
    expect(screen.getAllByText("Offline").length).toBeGreaterThan(0);
    expect(container.querySelector('[data-presence="offline"]')).not.toBeNull();
    rerender(<ChatLauncher presence="away" />);
    expect(screen.getAllByText("Away").length).toBeGreaterThan(0);
  });

  it("lamps the presence in a socket and never fills the launcher with brand", () => {
    const css = read("chat-launcher.css");
    const socket = /\.td-react-chat-lamp \{([^}]*)\}/.exec(css)!;
    expect(socket[1]).toMatch(/background: var\(--td-surface\)/);
    expect(/\.td-react-chat-lamp::after \{([^}]*)\}/.exec(css)![1]).toMatch(/background: var\(--td-lamp-glow\)/);
    // The design system's own FAB is a solid papaya pill. Not reproduced.
    expect(css).not.toMatch(/background:\s*var\(--td-brand\)/);
    expect(css).not.toMatch(/--td-lamp-glow:\s*currentColor/);
  });

  it("wraps the launcher in the halo only when the channel is AI", () => {
    const { container, rerender } = render(<ChatLauncher />);
    expect(container.querySelector(".td-react-aihalo")).toBeNull();
    rerender(<ChatLauncher ai />);
    expect(container.querySelector(".td-react-aihalo")).not.toBeNull();
  });
});

describe("AiHalo", () => {
  it("is light behind the control, never a fill on it", () => {
    const { container } = render(<AiHalo speed={7}><button type="button">Ask AI</button></AiHalo>);
    const halo = container.querySelector<HTMLElement>(".td-react-aihalo")!;
    expect(halo.style.getPropertyValue("--td-ai-speed")).toBe("7s");
    // The control is untouched — the halo wraps it and paints behind it.
    expect(halo.querySelector("button")).toHaveTextContent("Ask AI");
    const css = read("chat-launcher.css");
    // The light is the EDGE, not a shape behind the button. `padding` plus
    // `mask-composite: exclude` carves a band out of the pseudo-element, so a
    // rotating conic gradient inside it moves an arc around the perimeter —
    // where `transform: rotate()` on a blurred blob turned the whole shape and
    // read as a smear.
    const band = /\.td-react-aihalo::before,\n\.td-react-aihalo::after,\n\.td-react-aihalo-cast::before \{([^}]*)\}/.exec(css)!;
    expect(band[1]).toMatch(/padding: var\(--td-ai-ring\)/);
    expect(band[1]).toMatch(/mask-composite: exclude/);
    expect(css).not.toMatch(/aihalo[\s\S]{0,400}?transform: rotate/);
    // The angle is a registered property, or the engine steps it instead of
    // sweeping it.
    expect(css).toMatch(/@property --td-ai-angle \{[^}]*syntax: "<angle>"/);
    // The bead's own rule, not the band both pseudo-elements share.
    expect(css).toMatch(/\.td-react-aihalo::after \{[^}]*conic-gradient\(\s*from var\(--td-ai-angle\)/);
    expect(css).toMatch(/\.td-react-aihalo::after \{[^}]*opacity: 0;/);
    // The cast is a LAYER, not a drop-shadow: filters run before masks, so a
    // shadow on the masked ring was clipped by that ring and thrown away.
    expect(css).toMatch(/\.td-react-aihalo-cast \{[^}]*filter: blur\(/);
    expect(css).not.toMatch(/\.td-react-aihalo::(before|after) \{[^}]*drop-shadow/);
  });

  it("travels only while the control is engaged with, and quickens on press", () => {
    const css = read("chat-launcher.css");
    // A perpetual animation in the corner of a page is a thing readers learn to
    // filter out. The moment the mark has to say something is the moment
    // somebody reaches for the control.
    // The animation is on the WRAPPER, so the bead and its cast read one
    // inherited angle. Two animations drift, and a shadow that lags its own
    // light is worse than no shadow.
    expect(css).toMatch(/\[data-active="true"\]:hover,\n\.td-react-aihalo\[data-active="true"\]:focus-within \{\n\s*animation: td-react-aihalo-travel/);
    expect(css).toMatch(/\[data-active="true"\]:active \{\n\s*animation-duration: calc\(var\(--td-ai-speed, 3\.2s\) \/ 2\)/);
    expect(css).toMatch(/@property --td-ai-angle \{[^}]*inherits: true/);
    // The resting ring is not conditional: a mark that only exists on hover
    // marks nothing to a reader who never hovers.
    const rest = /\.td-react-aihalo::before \{([^}]*)\}/.exec(css)!;
    expect(rest[1]).toMatch(/opacity: 0\.5/);
  });

  it("stops dead under reduced motion but keeps the ring lit", () => {
    // A shine that merely slows is the same shine; the mark has to stay.
    // Every reduced-motion block, not just the last: the file has more than one
    // and which is last is an editing accident.
    const css = read("chat-launcher.css");
    const blocks = [...css.matchAll(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/g)].map(m => m[1]).join("\n");
    expect(blocks).toMatch(/\.td-react-aihalo\[data-active="true"\]:active \{ animation: none/);
    // The bead stays lit and still — only the travel goes.
    expect(blocks).not.toMatch(/aihalo[^}]*opacity: 0[^.]/);
  });

  it("turns off without reflowing anything", () => {
    const { container } = render(<AiHalo active={false}><button type="button">Off</button></AiHalo>);
    expect(container.querySelector(".td-react-aihalo")).not.toHaveAttribute("data-active");
  });
});

describe("Spotlight, the two it was missing", () => {
  it("binds the platform shortcut and toggles through onOpenChange", async () => {
    // The component still does not own WHETHER it is open — the shortcut calls
    // onOpenChange like any other trigger would.
    const onOpenChange = vi.fn();
    render(<Spotlight open={false} onOpenChange={onOpenChange} actions={[]} />);
    await userEvent.keyboard("{Control>}k{/Control}");
    expect(onOpenChange).toHaveBeenCalledWith(true);
    await userEvent.keyboard("{Meta>}k{/Meta}");
    expect(onOpenChange).toHaveBeenCalledTimes(2);
  });

  it("binds nothing when the app owns the keymap", async () => {
    const onOpenChange = vi.fn();
    render(<Spotlight open={false} onOpenChange={onOpenChange} actions={[]} shortcut={false} />);
    await userEvent.keyboard("{Control>}k{/Control}");
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("grows from the control that opened it rather than fading in at the centre", () => {
    const { container } = render(<Spotlight open onOpenChange={() => {}} actions={[]} origin="top-end" />);
    expect(container.querySelector('[data-origin="top-end"]')).not.toBeNull();
    const css = read("spotlight.css");
    expect(css).toMatch(/\[data-origin="top-end"\][^{]*\{ transform-origin: top right/);
    expect(css).toMatch(/@keyframes td-react-spotlight-grow/);
  });
});

describe("SocialButton", () => {
  it("is a link when given an href and a button otherwise, and names the platform either way", () => {
    const { unmount } = render(<SocialButton network="linkedin" href="https://example.com" />);
    const link = screen.getByRole("link", { name: "LinkedIn" });
    expect(link).toHaveAttribute("href", "https://example.com");
    unmount();

    render(<SocialButton network="whatsapp" />);
    expect(screen.getByRole("button", { name: "WhatsApp" })).toHaveAttribute("type", "button");
  });

  it("takes a label so several rows of these do not all read the same", () => {
    render(
      <>
        <SocialButton network="x" href="#a" label="Manoj on X" />
        <SocialButton network="x" href="#b" label="Rohan on X" />
      </>,
    );
    expect(screen.getByRole("link", { name: "Manoj on X" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Rohan on X" })).toBeInTheDocument();
  });

  it("carries the platform's own colour, and the mark is decoration rather than a second name", () => {
    const { container } = render(<SocialButton network="linkedin" href="#a" />);
    const link = container.querySelector("a")!;
    // The official LinkedIn hex, from Simple Icons.
    expect(link.style.getPropertyValue("--td-social-color")).toBe("#0A66C2");
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("inverts only the marks that are black, because a black chip on a dark page is a hole", () => {
    const { container: dark } = render(<SocialButton network="x" href="#a" />);
    const x = dark.querySelector("a")!;
    expect(x.style.getPropertyValue("--td-social-color")).toBe("#000000");
    expect(x.style.getPropertyValue("--td-social-color-dark")).toBe("#FFFFFF");
    expect(x.style.getPropertyValue("--td-social-ink-dark")).toBe("#000000");

    // A coloured mark keeps its colour in both themes — inverting one would be
    // restyling somebody's trademark.
    const { container: lit } = render(<SocialButton network="youtube" href="#a" />);
    const yt = lit.querySelector("a")!;
    expect(yt.style.getPropertyValue("--td-social-color-dark")).toBe(yt.style.getPropertyValue("--td-social-color"));
  });

  it("is drawn at Button's own heights, so a card's action row sits on one baseline", () => {
    const css = read("social-button.css");
    expect(css).toMatch(/--sm \{ width: 34px; height: 34px/);
    expect(css).toMatch(/--md \{ width: var\(--td-btn-h, 42px\)/);
    expect(css).toMatch(/--lg \{ width: var\(--td-btn-h-lg, 50px\)/);
  });

  it("presses like every other control rather than being a pasted-in logo", () => {
    const css = read("social-button.css");
    expect(css).toMatch(/\.td-react-social:active \{[^}]*inset 2px 2px 6px/);
    expect(css).toMatch(/\.td-react-social:active \.td-react-social-mark \{ transform: translate\(1px, 1px\)/);
  });

  it("has a surface tone that keeps the housing neutral and colours only the mark", () => {
    const css = read("social-button.css");
    // The tone's own housing rule, not the one-liner that sets its lamp colour.
    const surface = css.match(/\.td-react-social--surface \{\n[^}]*\}/)![0];
    expect(surface).toMatch(/background: var\(--td-raise-fill\)/);
    expect(surface).not.toMatch(/background: var\(--td-social-c\)/);
    expect(css).toMatch(/\.td-react-social--surface:hover \{[^}]*color: var\(--td-social-c\)/);
    // The lamp lights the platform's colour there — white on a carved surface
    // is a hole rather than a light.
    // The fallback is required, not incidental: `--td-lamp-glow` defaults to
    // `--td-green` at the root, so an unresolved platform variable would hand
    // this control a green halo from another file.
    expect(css).toMatch(/\.td-react-social--surface \{ --td-lamp-glow: var\(--td-social-c, var\(--td-ink\)\); \}/);
    expect(css).toMatch(/\.td-react-social \{ --td-lamp-glow: #fff; \}/);
  });

  it("lights its mark on hover and press, with the ladder every other lamp rides", () => {
    const css = read("social-button.css");
    expect(css).toMatch(/\.td-react-social-mark \{[^}]*filter: var\(--td-lamp-off\)/);
    // Colour first, glow second. The mark itself brightens across the three
    // rungs — off, lit, brighter — because a 4px drop-shadow alone is not
    // visible enough on a saturated housing to read as a lamp.
    expect(css).toMatch(/:hover \.td-react-social-mark \{[^}]*color: var\(--td-social-i\);[^}]*filter: var\(--td-lamp-hover\)/);
    expect(css).toMatch(/:active \.td-react-social-mark \{[^}]*color: color-mix\(in srgb, var\(--td-social-i\) 88%, white\);[^}]*filter: var\(--td-lamp-active\)/);
    expect(css).toMatch(/\.td-react-social-mark \{[^}]*color: color-mix\(in srgb, var\(--td-social-i\) 68%, transparent\)/);
    // The bloom is clipped to the housing, or it paints onto the page and reads
    // as the button leaking light.
    expect(css).toMatch(/\.td-react-social \{[\s\S]*?overflow: hidden;/);
  });
});
