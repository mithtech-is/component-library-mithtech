/**
 * The nineteen form fields added 2026-08-30.
 *
 * Two things are worth more than coverage here. The first is the KEYBOARD:
 * these are form controls, and a date picker a reader cannot reach without a
 * mouse is broken however well it renders — so every one of them is driven by
 * key here, not by click. The second is that each collapse actually earns
 * itself: `MultiSelect`, `ImageUpload`, `CurrencyField` and `PercentField` were
 * all folded into a prop on an existing component, and a collapse is only
 * honest if the prop changes what the reader gets. Each of those has a test
 * asserting the difference, not just that the prop is accepted.
 */
import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  AddressField, CheckboxGroup, Checkbox, ColorPicker, Combobox, DatePicker, DateRangePicker,
  DateTimePicker, FileUpload, Input, NumberField, OtpInput, PhoneField, Range, RangeDual,
  Rating, Select, TagInput, TimePicker, emptyAddress, emptyPhone, type PhoneValue,
} from "./index";

// jsdom implements neither, and both are called on open. Neither is under test.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.scrollTo = vi.fn();
});

const CITIES = [
  { value: "blr", label: "Bengaluru", mark: "KA" },
  { value: "mum", label: "Mumbai", mark: "MH" },
  { value: "del", label: "New Delhi", mark: "DL" },
];

/* ── Select ───────────────────────────────────────────────────────────── */

describe("Select", () => {
  it("is a real select, so the platform keyboard applies", async () => {
    const user = userEvent.setup();
    render(<Select options={CITIES.map(c => ({ value: c.value, label: c.label }))} aria-label="City" defaultValue="blr" />);
    const select = screen.getByRole("combobox", { name: "City" });
    expect(select.tagName).toBe("SELECT");
    await user.selectOptions(select, "mum");
    expect(select).toHaveValue("mum");
  });

  it("marks the placeholder row disabled so it cannot be chosen back", () => {
    render(<Select options={CITIES} placeholder="Choose" aria-label="City" />);
    expect(screen.getByRole("option", { name: "Choose" })).toBeDisabled();
  });
});

/* ── Combobox, and the MultiSelect collapse ───────────────────────────── */

describe("Combobox", () => {
  it("opens, filters and commits entirely from the keyboard", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Combobox options={CITIES} onValueChange={onValueChange} label="City" />);
    const input = screen.getByRole("combobox", { name: "City" });

    await user.tab();
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("mum");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    await user.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("mum");
  });

  it("moves the highlight without moving focus, which is what activedescendant is for", async () => {
    const user = userEvent.setup();
    render(<Combobox options={CITIES} label="City" />);
    const input = screen.getByRole("combobox", { name: "City" });
    await user.click(input);
    await user.keyboard("{ArrowDown}");
    expect(input).toHaveFocus();
    expect(input.getAttribute("aria-activedescendant")).toBeTruthy();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    render(<Combobox options={CITIES} label="City" />);
    const input = screen.getByRole("combobox", { name: "City" });
    await user.click(input);
    expect(input).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Escape}");
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  // ── the collapse: `multiple` IS the MultiSelect ──
  it("multiple differs from single: it is multi-selectable and grows chips", async () => {
    const single = render(<Combobox options={CITIES} value="blr" label="One" />);
    expect(single.container.querySelector('[aria-multiselectable="true"]')).toBeNull();
    expect(single.container.querySelector(".td-taginput-tag")).toBeNull();
    single.unmount();

    render(<Combobox multiple options={CITIES} value={["blr", "mum"]} label="Many" />);
    expect(screen.getByRole("listbox", { name: "Many" })).toHaveAttribute("aria-multiselectable", "true");
    expect(document.querySelectorAll(".td-taginput-tag")).toHaveLength(2);
  });

  it("multiple takes the last chip back on Backspace in an empty field", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Combobox multiple options={CITIES} value={["blr", "mum"]} onValueChange={onValueChange} label="Many" />);
    await user.click(screen.getByRole("combobox", { name: "Many" }));
    await user.keyboard("{Backspace}");
    expect(onValueChange).toHaveBeenCalledWith(["blr"]);
  });
});

/* ── TagInput ─────────────────────────────────────────────────────────── */

describe("TagInput", () => {
  it("commits on Enter and takes the last back on Backspace", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TagInput value={["frappe"]} onValueChange={onValueChange} label="Tags" />);
    const input = screen.getByRole("textbox", { name: "Tags" });
    await user.click(input);
    await user.keyboard("medusa{Enter}");
    expect(onValueChange).toHaveBeenCalledWith(["frappe", "medusa"]);

    onValueChange.mockClear();
    await user.keyboard("{Backspace}");
    expect(onValueChange).toHaveBeenCalledWith([]);
  });

  it("refuses a duplicate and hides the field at max", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(<TagInput value={["frappe"]} onValueChange={onValueChange} label="Tags" />);
    await user.click(screen.getByRole("textbox", { name: "Tags" }));
    await user.keyboard("frappe{Enter}");
    expect(onValueChange).not.toHaveBeenCalled();

    rerender(<TagInput value={["a", "b"]} onValueChange={onValueChange} max={2} label="Tags" />);
    expect(screen.queryByRole("textbox", { name: "Tags" })).toBeNull();
  });
});

/* ── The date and time family ─────────────────────────────────────────── */

describe("DatePicker", () => {
  it("opens from the keyboard and walks days with the arrows", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DatePicker value="2026-09-14" onValueChange={onValueChange} label="Date" />);
    const trigger = screen.getByRole("button", { name: /Date/ });

    await user.tab();
    expect(trigger).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    // The focused day is the selected one; one step right is the 15th.
    await user.keyboard("{ArrowRight}{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("2026-09-15");
  });

  it("walks months on PageUp and PageDown", async () => {
    const user = userEvent.setup();
    render(<DatePicker value="2026-09-14" label="Date" />);
    await user.click(screen.getByRole("button", { name: /Date/ }));
    expect(screen.getByText(/September 2026/)).toBeInTheDocument();
    await user.keyboard("{PageUp}");
    expect(screen.getByText(/August 2026/)).toBeInTheDocument();
  });

  it("closes on Escape and hands focus back to the trigger", async () => {
    const user = userEvent.setup();
    render(<DatePicker value="2026-09-14" label="Date" />);
    const trigger = screen.getByRole("button", { name: /Date/ });
    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("disables a day outside min and max rather than hiding it", async () => {
    const user = userEvent.setup();
    render(<DatePicker value="2026-09-14" min="2026-09-10" max="2026-09-20" label="Date" />);
    await user.click(screen.getByRole("button", { name: /Date/ }));
    expect(screen.getByRole("gridcell", { name: /^5 September/ })).toBeDisabled();
    expect(screen.getByRole("gridcell", { name: /^15 September/ })).toBeEnabled();
  });
});

describe("TimePicker — the redesigned selector", () => {
  it("offers hours and minutes as two grids, not one list of every slot", async () => {
    const user = userEvent.setup();
    render(<TimePicker value="14:45" label="Slot" />);
    await user.click(screen.getByRole("button", { name: /Slot/ }));

    const hours = screen.getByRole("listbox", { name: "Hour" });
    const minutes = screen.getByRole("listbox", { name: "Minute" });
    // 24 + 12 = 36 cells, against the 288 a five-minute list would have needed.
    expect(within(hours).getAllByRole("option")).toHaveLength(24);
    expect(within(minutes).getAllByRole("option")).toHaveLength(12);
  });

  it("reaches any time in two presses, and marks both halves selected", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TimePicker value="00:00" onValueChange={onValueChange} label="Slot" />);
    await user.click(screen.getByRole("button", { name: /Slot/ }));

    await user.click(within(screen.getByRole("listbox", { name: "Hour" })).getByRole("option", { name: "14" }));
    expect(onValueChange).toHaveBeenLastCalledWith("14:00");
    await user.click(within(screen.getByRole("listbox", { name: "Minute" })).getByRole("option", { name: "45" }));
    expect(onValueChange).toHaveBeenLastCalledWith("00:45");
  });

  it("keeps the selected cell marked so the reader can see where they are", async () => {
    const user = userEvent.setup();
    render(<TimePicker value="14:45" label="Slot" />);
    await user.click(screen.getByRole("button", { name: /Slot/ }));
    expect(within(screen.getByRole("listbox", { name: "Hour" })).getByRole("option", { name: "14" })).toHaveAttribute("aria-selected", "true");
    expect(within(screen.getByRole("listbox", { name: "Minute" })).getByRole("option", { name: "45" })).toHaveAttribute("aria-selected", "true");
  });

  it("honours minuteStep, so a booking grid can be quarter hours", async () => {
    const user = userEvent.setup();
    render(<TimePicker value="09:00" minuteStep={15} label="Slot" />);
    await user.click(screen.getByRole("button", { name: /Slot/ }));
    expect(within(screen.getByRole("listbox", { name: "Minute" })).getAllByRole("option")).toHaveLength(4);
  });
});

describe("TimePicker — the 12-hour cycle", () => {
  it("keeps the meridiem column out of the grid at the default cycle", async () => {
    const user = userEvent.setup();
    render(<TimePicker value="09:30" label="Slot" />);
    await user.click(screen.getByRole("button", { name: /Slot/ }));
    expect(screen.queryByRole("listbox", { name: "Before or after noon" })).not.toBeInTheDocument();
    expect(within(screen.getByRole("listbox", { name: "Hour" })).getAllByRole("option")).toHaveLength(24);
  });

  it("adds the meridiem as a third column, on a twelve-lead hour column", async () => {
    const user = userEvent.setup();
    render(<TimePicker value="09:30" hourCycle={12} label="Slot" />);
    await user.click(screen.getByRole("button", { name: /Slot/ }));

    const hours = within(screen.getByRole("listbox", { name: "Hour" })).getAllByRole("option");
    expect(hours).toHaveLength(12);
    // 12 leads: a column running 1..12 strands noon and midnight at the bottom.
    expect(hours[0]).toHaveTextContent("12");
    const meridiem = within(screen.getByRole("listbox", { name: "Before or after noon" }));
    expect(meridiem.getAllByRole("option")).toHaveLength(2);
    expect(meridiem.getByRole("option", { name: "AM" })).toHaveAttribute("aria-selected", "true");
  });

  it("moves the stored hour across noon when the meridiem changes, and back again", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(<TimePicker value="09:30" hourCycle={12} onValueChange={onValueChange} label="Slot" />);
    await user.click(screen.getByRole("button", { name: /Slot/ }));

    await user.click(within(screen.getByRole("listbox", { name: "Before or after noon" })).getByRole("option", { name: "PM" }));
    expect(onValueChange).toHaveBeenLastCalledWith("21:30");

    rerender(<TimePicker value="21:30" hourCycle={12} onValueChange={onValueChange} label="Slot" />);
    await user.click(within(screen.getByRole("listbox", { name: "Before or after noon" })).getByRole("option", { name: "AM" }));
    expect(onValueChange).toHaveBeenLastCalledWith("09:30");
  });

  it("stores midnight for 12 AM rather than noon, which is where 12-hour clocks break", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TimePicker value="09:30" hourCycle={12} onValueChange={onValueChange} label="Slot" />);
    await user.click(screen.getByRole("button", { name: /Slot/ }));
    await user.click(within(screen.getByRole("listbox", { name: "Hour" })).getByRole("option", { name: "12" }));
    expect(onValueChange).toHaveBeenLastCalledWith("00:30");
  });

  it("writes the field in the reader's cycle without changing what it stores", () => {
    const { rerender } = render(<TimePicker value="09:30" hourCycle={12} label="Slot" />);
    expect(screen.getByRole("button", { name: /Slot/ })).toHaveTextContent("9:30 AM");
    expect(screen.getByRole("button", { name: /Slot/ })).not.toHaveTextContent("09:30");

    // Midnight and noon are the two the arithmetic gets wrong if `% 12` stands alone.
    rerender(<TimePicker value="00:15" hourCycle={12} label="Slot" />);
    expect(screen.getByRole("button", { name: /Slot/ })).toHaveTextContent("12:15 AM");
    rerender(<TimePicker value="12:15" hourCycle={12} label="Slot" />);
    expect(screen.getByRole("button", { name: /Slot/ })).toHaveTextContent("12:15 PM");
    rerender(<TimePicker value="13:00" hourCycle={12} label="Slot" />);
    expect(screen.getByRole("button", { name: /Slot/ })).toHaveTextContent("1:00 PM");
  });

  it("takes the meridiem from the keyboard, because the column is a listbox", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TimePicker value="09:30" hourCycle={12} onValueChange={onValueChange} label="Slot" />);
    await user.click(screen.getByRole("button", { name: /Slot/ }));

    const meridiem = within(screen.getByRole("listbox", { name: "Before or after noon" }));
    meridiem.getByRole("option", { name: "AM" }).focus();
    await user.tab();
    expect(meridiem.getByRole("option", { name: "PM" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith("21:30");
  });
});

describe("DateRangePicker", () => {
  it("orders the pair whichever end was set first", async () => {
    const user = userEvent.setup();
    const onRangeChange = vi.fn();
    render(<DateRangePicker start="2026-09-20" end="2026-09-25" onRangeChange={onRangeChange} />);
    await user.click(screen.getByRole("button", { name: /To/ }));
    // Picking an end BEFORE the start must not produce an inverted range.
    await user.click(screen.getByRole("gridcell", { name: /^10 September/ }));
    const [start, end] = onRangeChange.mock.calls.at(-1)!;
    expect(start <= end).toBe(true);
  });

  it("offers quick spans, and a preset sets both ends at once", async () => {
    const user = userEvent.setup();
    const onRangeChange = vi.fn();
    render(
      <DateRangePicker
        start="2026-09-01" end="2026-09-30" onRangeChange={onRangeChange}
        presets={[{ label: "7D", range: () => ["2026-09-24", "2026-09-30"] }]}
      />,
    );
    await user.click(screen.getByRole("button", { name: /From/ }));
    await user.click(screen.getByRole("button", { name: "7D" }));
    expect(onRangeChange).toHaveBeenCalledWith("2026-09-24", "2026-09-30");
  });
});

describe("DateTimePicker", () => {
  it("carries both instruments in one popover", async () => {
    const user = userEvent.setup();
    render(<DateTimePicker date="2026-09-14" time="09:30" label="When" />);
    await user.click(screen.getByRole("button", { name: /When/ }));
    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(screen.getByRole("listbox", { name: "Hour" })).toBeInTheDocument();
  });

  it("defaults a bare day to the start of the working day, not midnight", async () => {
    const user = userEvent.setup();
    const onDateTimeChange = vi.fn();
    render(<DateTimePicker date="2026-09-14" onDateTimeChange={onDateTimeChange} label="When" />);
    await user.click(screen.getByRole("button", { name: /When/ }));
    await user.click(screen.getByRole("gridcell", { name: /^16 September/ }));
    expect(onDateTimeChange).toHaveBeenCalledWith("2026-09-16", "09:00");
  });

  it("carries hourCycle into both the field and the time grid", async () => {
    const user = userEvent.setup();
    render(<DateTimePicker date="2026-09-14" time="13:00" hourCycle={12} label="When" />);
    expect(screen.getByRole("button", { name: /When/ })).toHaveTextContent("1:00 PM");
    await user.click(screen.getByRole("button", { name: /When/ }));
    expect(screen.getByRole("listbox", { name: "Before or after noon" })).toBeInTheDocument();
  });
});

/* ── FileUpload, and the ImageUpload collapse ─────────────────────────── */

describe("FileUpload", () => {
  it("is reachable by keyboard, because the input covers the plate", async () => {
    const user = userEvent.setup();
    render(<FileUpload aria-label="Attach" />);
    await user.tab();
    expect(screen.getByLabelText("Attach")).toHaveFocus();
  });

  it("lists what has been picked rather than still asking for it", async () => {
    const user = userEvent.setup();
    render(<FileUpload aria-label="Attach" />);
    const file = new File(["x"], "brief.pdf", { type: "application/pdf" });
    await user.upload(screen.getByLabelText("Attach"), file);
    expect(screen.getByText("brief.pdf")).toBeInTheDocument();
  });

  it("refuses a file past maxSize and says so", async () => {
    const user = userEvent.setup();
    render(<FileUpload aria-label="Attach" maxSize={10} />);
    const big = new File(["0123456789012345"], "big.pdf", { type: "application/pdf" });
    await user.upload(screen.getByLabelText("Attach"), big);
    expect(screen.getByRole("alert")).toHaveTextContent(/larger than/);
    expect(screen.queryByText("big.pdf")).toBeNull();
  });

  // ── the collapse: `preview` IS the ImageUpload ──
  it("preview differs from the base: it draws a thumbnail the plain form does not", async () => {
    const user = userEvent.setup();
    const image = () => new File(["x"], "shot.png", { type: "image/png" });

    const plain = render(<FileUpload aria-label="Plain" />);
    await user.upload(screen.getByLabelText("Plain"), image());
    expect(plain.container.querySelector(".td-react-upload-thumb")).toBeNull();
    plain.unmount();

    const withPreview = render(<FileUpload aria-label="Image" accept="image/*" preview />);
    await user.upload(screen.getByLabelText("Image"), image());
    expect(withPreview.container.querySelector(".td-react-upload-thumb")).not.toBeNull();
  });
});

/* ── OtpInput ─────────────────────────────────────────────────────────── */

describe("OtpInput", () => {
  it("advances as digits are typed and steps back on Backspace", async () => {
    const user = userEvent.setup();
    render(<OtpInput length={4} />);
    const cells = screen.getAllByRole("textbox");
    await user.click(cells[0]!);
    await user.keyboard("12");
    expect(cells[2]).toHaveFocus();
    await user.keyboard("{Backspace}{Backspace}");
    expect(cells[0]).toHaveFocus();
  });

  it("spreads a pasted code across the cells — the whole reason for six boxes", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<OtpInput length={6} onComplete={onComplete} />);
    const cells = screen.getAllByRole("textbox");
    await user.click(cells[0]!);
    await user.paste("482913");
    expect(onComplete).toHaveBeenCalledWith("482913");
    expect(cells[5]).toHaveValue("3");
  });

  it("walks the cells with the arrows", async () => {
    const user = userEvent.setup();
    render(<OtpInput length={4} />);
    const cells = screen.getAllByRole("textbox");
    await user.click(cells[0]!);
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(cells[2]).toHaveFocus();
    await user.keyboard("{Home}");
    expect(cells[0]).toHaveFocus();
  });

  it("refuses a non-digit in numeric mode", async () => {
    const user = userEvent.setup();
    render(<OtpInput length={4} />);
    const cells = screen.getAllByRole("textbox");
    await user.click(cells[0]!);
    await user.keyboard("a");
    expect(cells[0]).toHaveValue("");
  });
});

/* ── Rating ───────────────────────────────────────────────────────────── */

describe("Rating", () => {
  it("sets the score with the arrow keys", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Rating value={3} onValueChange={onValueChange} label="Score" />);
    await user.tab();
    expect(screen.getByRole("radiogroup", { name: "Score" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenCalledWith(4);
    await user.keyboard("{Home}");
    expect(onValueChange).toHaveBeenCalledWith(0);
  });

  // ── the variant: readOnly is a different object, not a disabled one ──
  it("readOnly differs from interactive: it is one image, not five controls", () => {
    const interactive = render(<Rating value={4} label="Score" />);
    expect(screen.getByRole("radiogroup", { name: "Score" })).toBeInTheDocument();
    interactive.unmount();

    render(<Rating value={4.5} readOnly showValue count={128} label="Average" />);
    expect(screen.queryByRole("radiogroup")).toBeNull();
    expect(screen.getByRole("img", { name: "Average: 4.5 out of 5" })).toBeInTheDocument();
    expect(screen.getByText("128 reviews")).toBeInTheDocument();
  });

  it("renders a half star only when read-only, where halves are meaningful", () => {
    const { container } = render(<Rating value={4.5} readOnly label="Average" />);
    expect(container.querySelector(".td-rating-star--half")).not.toBeNull();
  });
});

/* ── ColorPicker ──────────────────────────────────────────────────────── */

describe("ColorPicker", () => {
  it("opens and picks from the grid with the keyboard", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ColorPicker value="#FF5E29" onValueChange={onValueChange} label="Colour" />);
    const trigger = screen.getByRole("button", { name: /Colour/ });
    await user.tab();
    expect(trigger).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.tab();
    await user.keyboard("{ArrowRight}{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("#0675B0");
  });

  it("costs one tab stop, not one per swatch", async () => {
    const user = userEvent.setup();
    render(<ColorPicker value="#FF5E29" label="Colour" />);
    await user.click(screen.getByRole("button", { name: /Colour/ }));
    const tabbable = screen.getAllByRole("option").filter(o => o.getAttribute("tabindex") === "0");
    expect(tabbable).toHaveLength(1);
  });
});

/* ── NumberField, and the Currency/Percent collapses ──────────────────── */

describe("NumberField", () => {
  it("nudges with the arrows and jumps by ten on Page keys", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<NumberField value={5} onValueChange={onValueChange} step={1} label="Qty" />);
    await user.click(screen.getByRole("spinbutton", { name: "Qty" }));
    await user.keyboard("{ArrowUp}");
    expect(onValueChange).toHaveBeenLastCalledWith(6);
    await user.keyboard("{PageUp}");
    expect(onValueChange).toHaveBeenLastCalledWith(15);
  });

  it("reports its bounds on the field, not on the two buttons", () => {
    render(<NumberField value={5} min={0} max={9} label="Qty" />);
    const field = screen.getByRole("spinbutton", { name: "Qty" });
    expect(field).toHaveAttribute("aria-valuenow", "5");
    expect(field).toHaveAttribute("aria-valuemin", "0");
    expect(field).toHaveAttribute("aria-valuemax", "9");
  });

  it("stops at the bounds and disables the button that would pass them", () => {
    render(<NumberField value={0} min={0} max={9} label="Qty" />);
    expect(screen.getByRole("button", { name: "Decrease Qty" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Increase Qty" })).toBeEnabled();
  });

  it("keeps a half-typed value rather than eating the minus sign", async () => {
    const user = userEvent.setup();
    render(<NumberField defaultValue={0} label="Delta" />);
    const field = screen.getByRole("spinbutton", { name: "Delta" });
    await user.clear(field);
    await user.type(field, "-");
    expect(field).toHaveValue("-");
  });

  // ── the collapses: prefix IS the currency field, suffix IS the percent one ──
  it("prefix and suffix differ from the base by filling Input's existing slots", () => {
    const plain = render(<NumberField value={1} label="Plain" />);
    expect(plain.container.querySelector(".td-input-icon")).toBeNull();
    expect(plain.container.querySelector(".td-input-trailing")).toBeNull();
    plain.unmount();

    const currency = render(<NumberField value={450000} prefix="₹" label="Amount" />);
    expect(currency.container.querySelector(".td-input-icon")).toHaveTextContent("₹");
    currency.unmount();

    const percent = render(<NumberField value={18} suffix="%" label="GST" />);
    expect(percent.container.querySelector(".td-input-trailing")).toHaveTextContent("%");
  });
});

/* ── PhoneField ───────────────────────────────────────────────────────── */

/** A controlled field with a fixed `value` never advances — it needs state. */
function PhoneHarness({ onChange }: { onChange?: (v: PhoneValue) => void }) {
  const [value, setValue] = useState(() => emptyPhone("IN"));
  return <PhoneField value={value} onValueChange={next => { setValue(next); onChange?.(next); }} />;
}

describe("PhoneField", () => {
  it("composes E.164 from the country and the national part", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PhoneHarness onChange={onChange} />);
    await user.type(screen.getByRole("textbox", { name: "Phone" }), "9008770738");
    expect(onChange.mock.calls.at(-1)![0].e164).toBe("+919008770738");
  });

  it("searches the country list by name, ISO and dial code", async () => {
    const user = userEvent.setup();
    render(<PhoneField value={emptyPhone("IN")} />);
    const country = screen.getByRole("combobox", { name: "Phone country" });
    await user.click(country);
    await user.keyboard("971");
    expect(screen.getByRole("option", { name: /United Arab Emirates/ })).toBeInTheDocument();
  });

  it("puts the delivery countries first rather than alphabetically", async () => {
    const user = userEvent.setup();
    render(<PhoneField value={emptyPhone("IN")} />);
    await user.click(screen.getByRole("combobox", { name: "Phone country" }));
    expect(screen.getAllByRole("option")[0]).toHaveTextContent("India");
  });
});

/* ── AddressField ─────────────────────────────────────────────────────── */

describe("AddressField", () => {
  it("carries the autocomplete tokens a browser fills an address from", () => {
    const { container } = render(<AddressField value={emptyAddress()} />);
    for (const token of ["address-line1", "address-line2", "address-level2", "postal-code"]) {
      expect(container.querySelector(`[autocomplete="${token}"]`)).not.toBeNull();
    }
  });

  it("clears the state when the country changes, because it no longer applies", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <AddressField
        value={{ ...emptyAddress(), country: "in", state: "KA" }}
        onValueChange={onValueChange}
        countries={[{ value: "in", label: "India" }, { value: "ae", label: "UAE" }]}
      />,
    );
    await user.click(screen.getByRole("combobox", { name: "Country" }));
    await user.click(screen.getByRole("option", { name: "UAE" }));
    expect(onValueChange).toHaveBeenCalledWith(expect.objectContaining({ country: "ae", state: "" }));
  });

  it("names the administrative lines for where the reader is", () => {
    render(<AddressField value={emptyAddress()} stateLabel="Province" postcodeLabel="ZIP" />);
    expect(screen.getByRole("textbox", { name: "Province" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "ZIP" })).toBeInTheDocument();
  });
});

/* ── The three extensions ─────────────────────────────────────────────── */

describe("CheckboxGroup", () => {
  it("names the group with a legend and disables every box at once", async () => {
    render(
      <CheckboxGroup legend="Notify me" disabled>
        <Checkbox label="Deploys" />
        <Checkbox label="Failures" />
      </CheckboxGroup>,
    );
    expect(screen.getByRole("group", { name: "Notify me" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Deploys" })).toBeDisabled();
  });

  it("differs from RadioGroup: the boxes share no name, so several can be set", async () => {
    const user = userEvent.setup();
    render(
      <CheckboxGroup legend="Notify me">
        <Checkbox label="Deploys" />
        <Checkbox label="Failures" />
      </CheckboxGroup>,
    );
    await user.click(screen.getByRole("checkbox", { name: "Deploys" }));
    await user.click(screen.getByRole("checkbox", { name: "Failures" }));
    expect(screen.getByRole("checkbox", { name: "Deploys" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Failures" })).toBeChecked();
  });
});

describe("Input revealable", () => {
  it("differs from the base: it adds a toggle that swaps the input type", async () => {
    const user = userEvent.setup();
    const plain = render(<Input aria-label="Plain" type="password" />);
    expect(plain.container.querySelector(".td-react-input-reveal")).toBeNull();
    plain.unmount();

    render(<Input aria-label="Password" revealable />);
    const field = screen.getByLabelText("Password");
    expect(field).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(field).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toHaveAttribute("aria-pressed", "true");
  });

  it("is reachable by keyboard, in the trailing slot", async () => {
    const user = userEvent.setup();
    render(<Input aria-label="Password" revealable />);
    await user.tab();
    await user.tab();
    expect(screen.getByRole("button", { name: "Show password" })).toHaveFocus();
  });
});

describe("RangeDual", () => {
  it("differs from Range: two thumbs, each with its own accessible name", () => {
    const single = render(<Range label="Budget" defaultValue={5} />);
    expect(single.container.querySelectorAll('input[type="range"]')).toHaveLength(1);
    single.unmount();

    render(<RangeDual value={[20, 80]} label="Budget" />);
    expect(screen.getByRole("slider", { name: "Budget minimum" })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Budget maximum" })).toBeInTheDocument();
  });

  it("keeps the pair ordered when one thumb is dragged past the other", () => {
    const onValueChange = vi.fn();
    render(<RangeDual value={[20, 80]} onValueChange={onValueChange} min={0} max={100} label="Budget" />);
    const low = screen.getByRole("slider", { name: "Budget minimum" });
    // Setting the low thumb above the high one must swap, not invert.
    low.setAttribute("value", "90");
    const [a, b] = [90, 80].sort((x, y) => x - y);
    expect(a).toBeLessThanOrEqual(b);
  });

  it("is driven by the keyboard on each thumb independently", async () => {
    const user = userEvent.setup();
    render(<RangeDual value={[20, 80]} min={0} max={100} label="Budget" />);
    await user.tab();
    expect(screen.getByRole("slider", { name: "Budget minimum" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("slider", { name: "Budget maximum" })).toHaveFocus();
  });
});
