import { createRef } from "react";
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

  it("carries the lamp on `primary` unless it is taken off, and nowhere else by default", () => {
    const { container, rerender } = render(<Button variant="primary" dot={false}>Save</Button>);
    expect(container.querySelector(".td-lamp")).toBeNull();
    rerender(<Button variant="secondary">Save</Button>);
    expect(container.querySelector(".td-lamp")).toBeNull();
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
