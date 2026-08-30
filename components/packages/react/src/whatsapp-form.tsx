"use client";

import { forwardRef, useId, useState, type ChangeEvent, type FormEvent, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import { Button } from "./button";
import { Dialog } from "./dialog";
import { FormField } from "./form-field";
import { Input, Textarea } from "./input";
import "./whatsapp-form.css";

export interface WhatsAppFormValues {
  name: string;
  email: string;
  phone: string;
  subject: string;
  company: string;
  industry: string;
  service: string;
  message: string;
  /** The page the form was opened from. Captured, never typed. */
  page: string;
}

/** Every field the form can draw. `page` is captured, never typed, so it is not one. */
export type WhatsAppFormField = "name" | "email" | "phone" | "subject" | "company" | "industry" | "service" | "message";

/**
 * How a field is drawn, or whether it is drawn at all.
 *
 * `required` puts it in the top block and refuses the hand-off without it,
 * `optional` puts it in the carved well, and `off` removes it from the form,
 * from the validation and from the composed message alike.
 */
export type WhatsAppFieldMode = "required" | "optional" | "off";

/**
 * The control that opens the form.
 *
 * - **Omitted** — the component's own `Button variant="whatsapp"`. Unchanged,
 *   so no existing caller moves.
 * - **A function** — your control, wired. It is a render function rather than
 *   a `ReactNode` on purpose: taking an element would mean cloning it to
 *   attach the handler, which silently loses a caller's own `onClick` and
 *   breaks the moment the element is a fragment or a component that does not
 *   forward props.
 * - **`false`** — no trigger at all. The form is then a dialog and nothing
 *   else, opened by whatever the page already has: a row in a floating menu,
 *   a channel tile, a link in prose, an action in a sticky bar. Drive it with
 *   `open` and `onOpenChange`.
 *
 * The `false` case is the one this component was missing, and it is why it
 * could not be adopted sitewide: a site with six WhatsApp entry points, none
 * of which is a standalone button, cannot use a component that renders one.
 */
export type WhatsAppFormTrigger = false | ((props: { open: () => void; isOpen: boolean }) => ReactNode);

/** The order the form draws its fields in, and which of them share a line. */
const ROWS: WhatsAppFormField[][] = [
  ["name", "phone"],
  ["email"],
  ["subject"],
  ["company", "industry"],
  ["service"],
  ["message"],
];

/**
 * What the form asks for when the caller says nothing.
 *
 * Kept exactly as it shipped so `fields` is additive. It is worth knowing that
 * `phone: "required"` is the debatable one: WhatsApp supplies the number by
 * definition, so asking for it again is a mandatory field on a channel that
 * already carries the answer. It stays the default because changing it would
 * silently change every existing caller's form; set `{ phone: "off" }` where
 * the number is genuinely redundant.
 */
const DEFAULT_FIELDS: Record<WhatsAppFormField, WhatsAppFieldMode> = {
  name: "required",
  email: "required",
  phone: "required",
  subject: "required",
  company: "optional",
  industry: "optional",
  service: "optional",
  message: "optional",
};

/** What a required field says when it is empty. */
const MISSING: Record<WhatsAppFormField, string> = {
  name: "Tell us who you are.",
  email: "We need somewhere to reply if WhatsApp fails.",
  phone: "The number you are messaging from.",
  subject: "One line on what this is about.",
  company: "Which company this is for.",
  industry: "Which industry you are in.",
  service: "Which service you are after.",
  message: "Say a little about what you need.",
};

/** The label each field carries into the message, in the order it is read. */
const LINES: [WhatsAppFormField, string][] = [
  ["name", "Name"],
  ["email", "Email"],
  ["phone", "Phone"],
  ["company", "Company"],
  ["industry", "Industry"],
  ["service", "Service required"],
];

export interface WhatsAppFormProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "onSubmit"> {
  /**
   * The number the message goes to, in international format. Punctuation is
   * stripped, so `+91 98765 43210` and `919876543210` are the same number — but
   * the country code is not optional: `wa.me` has no idea where a bare local
   * number lives.
   */
  phone: string;
  /** The trigger's text. */
  label?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  /** The button under the form. */
  submitLabel?: ReactNode;
  /**
   * Offered as a list instead of a free-text box when supplied. A list is
   * worth it for the answers you will act on — routing an enquiry by service
   * only works if the answers are the ones your routing knows.
   */
  services?: string[];
  industries?: string[];
  /**
   * The line that names where the enquiry came from. Defaults to the page's
   * own URL, read when the form opens.
   *
   * It is captured rather than asked for because nobody types their way to a
   * useful answer, and a sales team reading "the pricing page" answers
   * differently from one reading "the careers page".
   */
  page?: string;
  /** Off drops that line entirely. */
  includePage?: boolean;
  /**
   * The control that opens the form — or `false` for none at all. See
   * `WhatsAppFormTrigger`; omitted keeps the component's own button.
   */
  trigger?: WhatsAppFormTrigger;
  /**
   * Which fields the form asks for, merged over the defaults. Name them one at
   * a time: `{ phone: "off" }` drops the phone number and leaves everything
   * else exactly as it was.
   *
   * A field set to `off` is not rendered, not validated and not written into
   * the message. A field moved between `required` and `optional` moves between
   * the top block and the carved well with it — the well is *what optional
   * means* here, so the two cannot disagree.
   */
  fields?: Partial<Record<WhatsAppFormField, WhatsAppFieldMode>>;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * Runs after validation, with the composed message and the fields behind it.
   * Return `false` to stop the hand-off — for a consent gate, say. Anything
   * else lets WhatsApp open.
   */
  onSend?: (message: string, values: WhatsAppFormValues) => boolean | void;
}

const EMPTY: WhatsAppFormValues = {
  name: "", email: "", phone: "", subject: "", company: "", industry: "", service: "", message: "", page: "",
};

/* Deliberately loose. A stricter pattern rejects real addresses — plus
   addressing, new TLDs, quoted locals — and the only thing that ever proves an
   address is sending to it. This catches the typo, not the exotic. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/* Seven digits is the shortest national number in use anywhere; punctuation
   and a country code are allowed through and normalised later. */
const PHONE = /^\+?[\d\s().-]{7,}$/;

/**
 * The message, in the order a person reads one.
 *
 * Only what was actually filled in. A run of "Company: —" lines makes the
 * message look like a form rather than like somebody writing to you — which
 * is also what makes a turned-off field cost nothing here: it is empty, so it
 * was already being skipped.
 */
function compose(values: WhatsAppFormValues): string {
  const lines: string[] = [];
  if (values.subject) lines.push(`*${values.subject}*`, "");
  for (const [field, label] of LINES) {
    if (values[field]) lines.push(`${label}: ${values[field]}`);
  }
  if (values.message) lines.push("", values.message);
  if (values.page) lines.push("", `Sent from: ${values.page}`);
  return lines.join("\n");
}

/**
 * The WhatsApp enquiry: a button that opens a short form and hands the finished
 * message to WhatsApp, addressed to one number.
 *
 * **Nothing is submitted anywhere.** The form composes a message and opens
 * `wa.me` with it — the reader sends it themselves, from their own account, and
 * no field ever reaches a server of yours. That is the whole reason to prefer
 * this over a contact form for a channel people already trust: there is no
 * inbox to wonder about, and the reader keeps a copy of what they sent in a
 * thread they can come back to.
 *
 * Which also means it is **not a substitute for a form that has to be
 * received**. If the enquiry must land in a CRM whether or not the reader
 * completes the hand-off, post it to your own endpoint and use this beside it,
 * not instead of it.
 *
 * The page the reader was on is captured rather than asked for, because nobody
 * types their way to a useful answer, and it is the single field that most
 * changes how the enquiry should be answered.
 *
 * ## The trigger is not the component
 *
 * It renders a `Button variant="whatsapp"` by default and did so
 * unconditionally, which meant adopting the component meant accepting that
 * button. A site's WhatsApp entry points are almost never one shape — a row
 * inside a floating menu, a hero control whose icon carries the state, a
 * channel tile beside Email and Phone, a link in prose, an action in a sticky
 * bar — and replacing six deliberately different triggers with six identical
 * ones is a worse page, not a more consistent one.
 *
 * So `trigger` takes a render function for a control of your own, or `false`
 * for none at all. With `false` this is a dialog and nothing else: hold `open`
 * yourself and open it from whatever the page already has. The default is
 * unchanged.
 *
 * ## The fields are the caller's decision
 *
 * `fields` names one field at a time. The one worth thinking about is the
 * phone number: WhatsApp supplies it by definition, so a required phone field
 * asks again for the thing the channel already carries — which is a good way
 * to lose a conversation somebody was one tap from starting. It is still
 * required by default, because changing that would change every existing
 * caller's form without them asking; pass `{ phone: "off" }` where it is
 * redundant.
 */
export const WhatsAppForm = forwardRef<HTMLDivElement, WhatsAppFormProps>(function WhatsAppForm(
  {
    phone,
    label = "WhatsApp us",
    title = "Message us on WhatsApp",
    description = "Fill this in and it opens WhatsApp with the message ready to send. Nothing is submitted here.",
    submitLabel = "Open WhatsApp",
    services,
    industries,
    page,
    includePage = true,
    trigger,
    fields,
    open,
    defaultOpen = false,
    onOpenChange,
    onSend,
    className,
    ...props
  },
  ref,
) {
  const base = useId();
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const isOpen = open ?? uncontrolled;
  const [values, setValues] = useState<WhatsAppFormValues>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof WhatsAppFormValues, string>>>({});

  /* Merged rather than replaced, so `fields` names only what differs from the
     shipped form. Passing the whole record would make every caller restate
     seven decisions to change one, and a caller who forgets a key would find
     the field silently gone rather than left alone. */
  const mode = { ...DEFAULT_FIELDS, ...fields };
  const shown = ROWS.flat().filter(field => mode[field] !== "off");

  const setOpen = (next: boolean) => {
    if (open === undefined) setUncontrolled(next);
    onOpenChange?.(next);
    // A form the reader abandoned should not be waiting for them, half filled,
    // the next time they open it.
    if (!next) { setValues(EMPTY); setErrors({}); }
  };

  const set = (key: keyof WhatsAppFormValues) => (value: string) => {
    setValues(current => ({ ...current, [key]: value }));
    // Clearing on edit rather than re-validating on every keystroke: a message
    // that disappears the moment you start fixing it is encouraging, and one
    // that updates while you type mid-word is nagging.
    setErrors(current => (current[key] ? { ...current, [key]: undefined } : current));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const found: Partial<Record<keyof WhatsAppFormValues, string>> = {};
    for (const field of shown) {
      const value = values[field].trim();
      if (!value) {
        if (mode[field] === "required") found[field] = MISSING[field];
        continue;
      }
      /* Format is checked on anything the reader actually typed, whether or
         not it was demanded. An optional address with a typo in it is a reply
         that never arrives, and the field being optional says nothing about
         whether what was entered is an address. */
      if (field === "email" && !EMAIL.test(value)) found.email = "That does not look like an email address.";
      if (field === "phone" && !PHONE.test(value)) found.phone = "That does not look like a phone number.";
    }
    if (Object.keys(found).length) { setErrors(found); return; }

    /* The page is read HERE rather than in an effect on open, so it is right
       even in a single-page app where the reader navigated with the form
       already mounted — and so the component never touches `window` during
       render, which would break server rendering outright. */
    const captured = includePage
      ? page ?? (typeof window === "undefined" ? "" : window.location.href)
      : "";
    /* A field that is off contributes nothing, even if it holds a value from
       before the caller turned it off — the composed message and the values
       handed to `onSend` have to agree with the form the reader saw. */
    const filled = { ...values, page: captured };
    for (const field of ROWS.flat()) if (mode[field] === "off") filled[field] = "";
    const message = compose(filled);
    if (onSend?.(message, filled) === false) return;

    const number = phone.replace(/\D/g, "");
    const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    if (typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  const choice = (key: "industry" | "service", options: string[] | undefined, placeholder: string) =>
    options ? (
      <span className="td-react-wa-select">
        <select
          className="td-react-wa-native"
          id={`${base}-${key}`}
          value={values[key]}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => set(key)(event.target.value)}
        >
          <option value="">{placeholder}</option>
          {options.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
      </span>
    ) : (
      <Input id={`${base}-${key}`} value={values[key]} onChange={event => set(key)(event.target.value)} />
    );

  /** One field, drawn the way that field is drawn. */
  const draw = (field: WhatsAppFormField) => {
    const id = `${base}-${field}`;
    const isRequired = mode[field] === "required";
    /* `key` is passed explicitly rather than spread: React 19 warns on a key
       inside a spread object and reads it as an ordinary prop. */
    const shared = { htmlFor: id, error: errors[field], ...(isRequired ? { required: true } : { optional: true }) };
    const onChange = (event: { target: { value: string } }) => set(field)(event.target.value);
    if (field === "industry" || field === "service") {
      return <FormField key={field} label={field === "industry" ? "Industry" : "Service required"} {...shared}>
        {choice(field, field === "industry" ? industries : services, field === "industry" ? "Choose an industry" : "Choose a service")}
      </FormField>;
    }
    if (field === "message") {
      return <FormField key={field} label="Anything else" {...shared}>
        <Textarea id={id} rows={3} value={values.message} onChange={onChange} />
      </FormField>;
    }
    const TYPES: Partial<Record<WhatsAppFormField, { type?: string; autoComplete?: string }>> = {
      name: { autoComplete: "name" },
      phone: { type: "tel", autoComplete: "tel" },
      email: { type: "email", autoComplete: "email" },
      company: { autoComplete: "organization" },
    };
    const LABELS: Partial<Record<WhatsAppFormField, string>> = {
      name: "Name", phone: "Phone", email: "Email", subject: "Subject", company: "Company",
    };
    return <FormField key={field} label={LABELS[field]} {...shared}>
      <Input id={id} {...TYPES[field]} value={values[field]} onChange={onChange} />
    </FormField>;
  };

  /* The declared rows, filtered to the block being drawn. Filtering rather
     than re-deriving keeps the shipped layout byte-identical when nothing is
     reconfigured, and a row whose partner was turned off collapses to a single
     full-width field instead of leaving half a line empty. */
  const block = (want: WhatsAppFieldMode) =>
    ROWS
      .map(row => row.filter(field => mode[field] === want))
      .filter(row => row.length > 0)
      .map(row => row.length > 1
        ? <div className="td-react-wa-row" key={row.join("-")}>{row.map(draw)}</div>
        : draw(row[0]));

  const optional = block("optional");

  return (
    <div {...props} ref={ref} className={cx("td-react-wa", className)}>
      {/* `trigger === false` renders nothing at all — the form is then a
          dialog the page opens from whatever control it already has. The
          wrapper is `display: contents`, so an empty one costs no layout. */}
      {trigger === false
        ? null
        : trigger
          ? trigger({ open: () => setOpen(true), isOpen })
          : <Button variant="whatsapp" onClick={() => setOpen(true)}>{label}</Button>}

      <Dialog
        open={isOpen}
        onOpenChange={setOpen}
        title={title}
        description={description}
        /* The submit button lives in the dialog's footer but belongs to the
           form, which is a sibling of it in the DOM — `form=` is what ties the
           two together without nesting the footer inside the form or wiring a
           ref between them. */
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="whatsapp" type="submit" form={`${base}-form`}>{submitLabel}</Button>
          </>
        }
      >
        <form id={`${base}-form`} className="td-react-wa-form" onSubmit={submit} noValidate>
          {block("required")}

          {/* The optional half is a carved WELL rather than a rule and a grey
              sentence. Depth is how this system says "subordinate": four more
              fields at the same weight as the four above read as a wall of
              eight, while the same four sitting IN the panel read as one
              thing the reader may skip. The fields inside keep their own
              `optional` tags, so nothing depends on seeing the recess.

              It is dropped entirely when nothing is optional: an empty well
              with a legend on it is a promise of fields that are not there. */}
          {optional.length ? (
            <fieldset className="td-react-wa-optional">
              <legend className="td-react-wa-optional-legend">Optional — it only changes who picks the message up</legend>
              {optional}
            </fieldset>
          ) : null}

          {includePage ? (
            <p className="td-react-wa-page">
              The page you are on is added to the message, so we know what you were reading.
            </p>
          ) : null}
        </form>
      </Dialog>
    </div>
  );
});
