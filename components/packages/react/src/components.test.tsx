import { createRef } from "react";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { Badge, Button, Card, FormField, Input, Textarea } from "./index";

describe("Button", () => {
  it("forwards native behavior, semantics, classes, and refs", async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLButtonElement>();
    let presses = 0;
    render(<Button ref={ref} variant="filled" size="lg" onClick={() => presses++}>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveClass("td-coloured", "td-react-button--lg");
    expect(ref.current).toBe(button);
    await user.click(button);
    expect(presses).toBe(1);
  });

  it("makes `primary` the surface housing with the lamp, and `filled` the fill", () => {
    // The design system draws exactly one primary button: `.td-primary`, a
    // carved surface carrying a 7px lamp. The library used to give that name
    // to the papaya fill — the one move the system forbids — and hid the real
    // primary under `secondary`, which is why nobody could find it.
    const { container, rerender } = render(<Button variant="primary">Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveClass("td-primary");
    expect(button).not.toHaveClass("td-coloured");
    expect(container.querySelector(".td-lamp")).not.toBeNull();

    rerender(<Button variant="filled">Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toHaveClass("td-coloured");
  });

  it("carries the lamp on `primary` and `filled`, and nowhere else by default", () => {
    const { container, rerender } = render(<Button variant="primary" dot={false}>Save</Button>);
    expect(container.querySelector(".td-lamp")).toBeNull();
    rerender(<Button variant="secondary">Save</Button>);
    expect(container.querySelector(".td-lamp")).toBeNull();
    // The orange button gets one too — it is the loudest thing the system says,
    // and it should not be the one emphatic control reporting nothing.
    rerender(<Button variant="filled">Save</Button>);
    expect(container.querySelector(".td-lamp")).not.toBeNull();
    // ...but any variant can opt in when it reports a live state.
    rerender(<Button variant="outline" dot>Synced</Button>);
    expect(container.querySelector(".td-lamp")).not.toBeNull();
  });

  it("exposes loading state and prevents activation", async () => {
    const user = userEvent.setup();
    let presses = 0;
    render(<Button loading loadingLabel="Saving" onClick={() => presses++}>Save</Button>);
    const button = screen.getByRole("button", { name: "Saving" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    await user.click(button);
    expect(presses).toBe(0);
  });
});

describe("Button as a link", () => {
  // Every primary call to action on a marketing page is a link, and while
  // `Button` could only be a `<button>` every consumer hand-wrote an
  // `<a className="td-primary">` with its own `<span className="td-lamp">`
  // inside it — the design system's primary control, reimplemented at the
  // call site.
  it("renders an anchor carrying the same classes as the button form", () => {
    const { container, rerender } = render(<Button variant="primary" size="lg">Book</Button>);
    const asButton = screen.getByRole("button", { name: "Book" }).className;

    rerender(<Button variant="primary" size="lg" href="/audit">Book</Button>);
    const link = screen.getByRole("link", { name: "Book" });
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/audit");
    expect(link.className).toBe(asButton);
    // `type` is a button attribute and means nothing on an anchor.
    expect(link).not.toHaveAttribute("type");
    expect(container.querySelector("button")).toBeNull();
  });

  it("keeps the lamp on `primary` and `filled` in the anchor form", () => {
    const { container, rerender } = render(<Button variant="primary" href="/audit">Book</Button>);
    expect(container.querySelector("a .td-lamp")).not.toBeNull();
    rerender(<Button variant="filled" href="/audit">Book</Button>);
    expect(container.querySelector("a .td-lamp")).not.toBeNull();
  });

  it("hands `renderLink` the resolved class, the href and the glow", () => {
    const calls: { className: string; href: string; style?: Record<string, unknown> }[] = [];
    render(
      <Button
        variant="primary"
        href="/audit"
        glow="#FF5E29"
        renderLink={({ className, href, style, children }) => {
          calls.push({ className, href, style: style as Record<string, unknown> });
          return <a className={className} href={href} style={style} data-router="next">{children}</a>;
        }}
      >
        Book
      </Button>,
    );
    expect(calls).toHaveLength(1);
    expect(calls[0].href).toBe("/audit");
    expect(calls[0].className).toContain("td-react-button");
    expect(calls[0].className).toContain("td-primary");
    expect(calls[0].className).toContain("td-react-button--primary");
    // The glow rides on `style`, so a router link that spreads it still lights
    // the colour the caller asked for.
    expect(calls[0].style?.["--td-lamp-glow"]).toBe("#FF5E29");
    const link = screen.getByRole("link", { name: "Book" });
    expect(link).toHaveAttribute("data-router", "next");
  });

  it("falls back to a disabled button when the link cannot be followed", () => {
    // `disabled` is not something HTML gives an anchor, and the whole disabled
    // ladder is written at `:disabled` — an `<a aria-disabled>` would keep the
    // lit press ladder and read as pressable while doing nothing.
    let rendered = 0;
    const { rerender } = render(
      <Button href="/audit" disabled renderLink={({ className, href, children }) => { rendered++; return <a className={className} href={href}>{children}</a>; }}>Book</Button>,
    );
    expect(screen.getByRole("button", { name: "Book" })).toBeDisabled();
    expect(screen.queryByRole("link")).toBeNull();
    expect(rendered).toBe(0);

    rerender(<Button href="/audit" loading loadingLabel="Opening">Book</Button>);
    const busy = screen.getByRole("button", { name: "Opening" });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute("aria-busy", "true");
  });
});

describe("Form controls", () => {
  it("connects label, help, required and input semantics", () => {
    render(
      <FormField label="Email" helperText="Work address" required>
        <Input type="email" />
      </FormField>,
    );
    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input).toBeRequired();
    expect(input).toHaveAccessibleDescription("Work address");
  });

  it("describes the control with its error rather than announcing it assertively", () => {
    render(
      <FormField label="Summary" error="Summary is required">
        <Textarea />
      </FormField>,
    );
    const control = screen.getByRole("textbox", { name: "Summary" });
    expect(control).toHaveAttribute("aria-invalid", "true");
    expect(control).toHaveAccessibleDescription("Summary is required");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("Static components", () => {
  it("renders semantic extension classes and native attributes", () => {
    render(
      <Card depth="inset" data-testid="card">
        <Badge variant="success">Ready</Badge>
      </Card>,
    );
    expect(screen.getByTestId("card")).toHaveClass("td-panel", "td-react-card--inset");
    expect(screen.getByText("Ready")).toHaveClass("td-badge", "td-badge--green");
  });

  it("has no critical or serious automated accessibility violations", async () => {
    render(
      <main>
        <Card>
          <FormField label="Name" helperText="Public display name" required><Input /></FormField>
          <Button variant="filled">Save</Button>
          <Badge variant="success">Ready</Badge>
        </Card>
      </main>,
    );
    const result = await axe.run(document.body, { rules: { "color-contrast": { enabled: false } } });
    expect(result.violations.filter(item => item.impact === "critical" || item.impact === "serious")).toEqual([]);
  });
});

describe("the dot's brightness ladder", () => {
  const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "button.css"), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "");
  const slots = (rule: string) => {
    const value = /box-shadow:([\s\S]*?);/.exec(rule)?.[1] ?? "";
    // Split on commas outside parentheses — `color-mix(in srgb, …)` has its own.
    let depth = 0, current = "", parts: string[] = [];
    for (const char of value) {
      if (char === "(") depth += 1;
      if (char === ")") depth -= 1;
      if (char === "," && depth === 0) { parts.push(current); current = ""; continue; }
      current += char;
    }
    if (current.trim()) parts.push(current);
    return parts.length;
  };

  it("carries the same number of shadow slots at every rung, on both housings", () => {
    // Core's ramp adds its wide halo only at the bottom rung — one slot at rest
    // and hover, two on press — and a shadow list only interpolates against a
    // list of the same length. The disc jumped to its pressed state instead of
    // brightening into it, on every primary and every filled button.
    for (const housing of ["td-primary", "td-coloured"]) {
      const rungs = [...css.matchAll(new RegExp(`\\.td-react-button\\.${housing}[^{]*\\.td-lamp \\{[^}]*\\}`, "g"))]
        .map(m => m[0])
        .filter(rule => rule.includes("box-shadow"));
      expect(rungs.length).toBeGreaterThan(2);
      expect(new Set(rungs.map(slots))).toEqual(new Set([2]));
    }
  });

  it("leaves the unlit disc as glass on a fill, never as a hole", () => {
    // `.td-coloured`'s own rest is rgba(0, 0, 0, 0.28) — black on papaya reads
    // as a hole punched in the button. Four dark-fill variants had been given a
    // translucent white one at a time; `filled` and `destructive` were missed,
    // which is a list that will always be one behind the variants.
    const rest = /\.td-react-button\.td-coloured \.td-lamp \{([^}]*)\}/.exec(css)![1];
    expect(rest).toMatch(/background: rgba\(255, 255, 255/);
    expect(css).not.toMatch(/--accept, \.td-react-button--cancel[^{]*\.td-lamp \{ background/);
  });
});
