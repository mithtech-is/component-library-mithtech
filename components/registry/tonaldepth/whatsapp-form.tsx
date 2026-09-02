"use client";

import { forwardRef, useId, useState, type ChangeEvent, type FormEvent, type HTMLAttributes, type ReactNode } from "react";
import "./tonaldepth-whatsapp-form.css";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export interface TonalDepthWhatsAppFormValues {
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
  /** Answers to `extraFields`, keyed by their `id`. Empty when there are none. */
  custom: Record<string, string>;
}

/** Every field the form can draw. `page` is captured, never typed, so it is not one. */
export type TonalDepthWhatsAppFormField = "name" | "email" | "phone" | "subject" | "company" | "industry" | "service" | "message";

/**
 * How a field is drawn, or whether it is drawn at all.
 *
 * `required` puts it in the top block and refuses the hand-off without it,
 * `optional` puts it in the carved well, and `off` removes it from the form,
 * from the validation and from the composed message alike.
 */
export type TonalDepthWhatsAppFieldMode = "required" | "optional" | "off";

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
export type TonalDepthWhatsAppFormTrigger = false | ((props: { open: () => void; isOpen: boolean }) => ReactNode);

/** The order the form draws its fields in, and which of them share a line. */
const TonalDepthROWS: TonalDepthWhatsAppFormField[][] = [
  ["name", "phone"],
  ["email", "subject"],
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
const TonalDepthDEFAULT_FIELDS: Record<TonalDepthWhatsAppFormField, TonalDepthWhatsAppFieldMode> = {
  name: "required",
  email: "required",
  phone: "required",
  subject: "required",
  company: "optional",
  industry: "optional",
  service: "optional",
  message: "optional",
};

/**
 * A field the caller defines, beyond the eight this form knows by name.
 *
 * The built-in eight are the questions a WhatsApp enquiry almost always asks,
 * and `fields` turns them on and off. This is the other half: a form that
 * needs "Fleet size" or "Preferred slot" should not have to fork the
 * component, and it should not have to reach for a generic form builder
 * either — the whole value here is the TonalDepthcompose-and-hand-off, and that is
 * indifferent to how many questions produced the message.
 *
 * A custom field is drawn, validated and written into the message exactly the
 * way a built-in one is. It costs nothing when absent.
 */
export interface TonalDepthWhatsAppCustomField {
  /**
   * The key it is stored under and, by default, the label it carries into the
   * message. Must not collide with a built-in name — a custom `phone` would
   * shadow the field that owns the dial-code picker, so it is refused.
   */
  id: string;
  label: ReactNode;
  /**
   * Defaults to `optional`, so adding a question never silently starts
   * blocking a hand-off that used to go through.
   */
  mode?: TonalDepthWhatsAppFieldMode;
  /** How it is drawn. `choice` needs `options`; everything else is one input. */
  kind?: "text" | "email" | "tel" | "number" | "textarea" | "choice";
  options?: string[];
  placeholder?: string;
  /** What it is called in the composed message. Defaults to the label. */
  messageLabel?: string;
  /** What it says when it is required and empty. */
  missing?: string;
}

/**
 * The named forms this component ships.
 *
 * A variant is a FIELD SET with a name, not a new component: every one of them
 * composes the same message and hands it to the same `wa.me`. They exist
 * because "which questions" is the only thing that actually differs between a
 * quote request and a callback request, and a consumer choosing between five
 * named answers makes a better choice than one assembling eight booleans.
 *
 * `fields` still merges over whichever variant is chosen, so a variant is a
 * starting point rather than a cage.
 */
export type TonalDepthWhatsAppFormVariant = "enquiry" | "quick" | "callback" | "quote" | "support";

export interface TonalDepthWhatsAppFormVariantSpec {
  /** What this form is called, for a picker or a docs list. */
  name: string;
  /** One line on what it is for, and when to reach for it. */
  description: string;
  fields: Record<TonalDepthWhatsAppFormField, TonalDepthWhatsAppFieldMode>;
  title: string;
  submitLabel: string;
}

const TonalDepthOFF: Record<TonalDepthWhatsAppFormField, TonalDepthWhatsAppFieldMode> = {
  name: "off", email: "off", phone: "off", subject: "off",
  company: "off", industry: "off", service: "off", message: "off",
};

export const TonalDepthWHATSAPP_FORM_VARIANTS: Record<TonalDepthWhatsAppFormVariant, TonalDepthWhatsAppFormVariantSpec> = {
  /* The form as it shipped, named. It is first and it is the default, so a
     caller who says nothing gets exactly what they had. */
  enquiry: {
    name: "Enquiry",
    description: "The full form: who you are, how to reach you, and what you need. The general-purpose one.",
    fields: TonalDepthDEFAULT_FIELDS,
    title: "Message us on WhatsApp",
    submitLabel: "Open WhatsApp",
  },
  /*
   * The argument against asking anything at all.
   *
   * WhatsApp already carries who is writing and how to reach them — the
   * account IS the identity — so a form in front of it is a toll on a
   * conversation somebody was one tap from starting. Two questions is the
   * least that still produces a message worth routing.
   */
  quick: {
    name: "Quick message",
    description: "Two questions. The channel already knows who they are; this only asks what it is about.",
    fields: { ...TonalDepthOFF, subject: "required", message: "required" },
    title: "Message us on WhatsApp",
    submitLabel: "Open WhatsApp",
  },
  /*
   * The one variant where the phone number is the POINT rather than a
   * duplicate. "Call me back" is a request for a voice call, and the number to
   * ring is not necessarily the WhatsApp account writing — a person messaging
   * from a personal handset may want the desk phone called.
   */
  callback: {
    name: "Call me back",
    description: "A name and the number to ring. The one form where asking for a phone number is not asking twice — the number to call need not be the account writing.",
    fields: { ...TonalDepthOFF, name: "required", phone: "required", subject: "optional", message: "optional" },
    title: "Ask us to call you back",
    submitLabel: "Send the request",
  },
  quote: {
    name: "Request a quote",
    description: "Enough to price the work: who, what, which sector and which service. Sized for a sales team that routes by answer.",
    fields: { ...TonalDepthOFF, name: "required", phone: "required", company: "required", industry: "optional", service: "required", message: "optional" },
    title: "Ask for a quote",
    submitLabel: "Send the request",
  },
  support: {
    name: "Support request",
    description: "For an existing customer with a problem. The account and the number identify them; the subject and the detail are what the desk needs.",
    fields: { ...TonalDepthOFF, name: "required", phone: "required", subject: "required", message: "required" },
    title: "Get support on WhatsApp",
    submitLabel: "Open WhatsApp",
  },
};

/** Every built-in name, so a custom field cannot quietly shadow one. */
const TonalDepthBUILT_IN = new Set<string>(["name", "email", "phone", "subject", "company", "industry", "service", "message", "page"]);

/** What a required field says when it is empty. */
const TonalDepthMISSING: Record<TonalDepthWhatsAppFormField, string> = {
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
const TonalDepthLINES: [TonalDepthWhatsAppFormField, string][] = [
  ["name", "Name"],
  ["email", "Email"],
  ["phone", "Phone"],
  ["company", "Company"],
  ["industry", "Industry"],
  ["service", "Service required"],
];

export interface TonalDepthWhatsAppFormProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "onSubmit"> {
  /**
   * The number the message goes to, in international format. Punctuation is
   * stripped, so `+91 98765 43210` and `919876543210` are the same number — but
   * the country code is not optional: `wa.me` has no idea where a bare local
   * number lives.
   */
  phone: string;
  /** The trigger's text. */
  label?: ReactNode;
  /**
   * Which named form to draw. Defaults to `enquiry`, which is the form exactly
   * as it shipped — so a caller who says nothing moves nowhere.
   *
   * A variant sets the field modes, the dialog's title and the submit label;
   * `fields` merges over it and an explicit `title` or `submitLabel` wins
   * outright. Read `TonalDepthWHATSAPP_FORM_VARIANTS` for what each one asks and why.
   */
  variant?: TonalDepthWhatsAppFormVariant;
  title?: ReactNode;
  description?: ReactNode;
  /** The button under the form. */
  submitLabel?: ReactNode;
  /**
   * Questions of your own, drawn after the built-in ones.
   *
   * Each is validated and written into the message the way a built-in field
   * is, and each obeys the same `required` / `optional` split — so a custom
   * `optional` field lands in the same carved well as `company` rather than
   * inventing a third place for a question to live.
   *
   * An id that collides with a built-in name is refused with a warning rather
   * than silently shadowing the field that owns the dial-code picker.
   */
  extraFields?: TonalDepthWhatsAppCustomField[];
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
   * `TonalDepthWhatsAppFormTrigger`; omitted keeps the component's own button.
   */
  trigger?: TonalDepthWhatsAppFormTrigger;
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
  fields?: Partial<Record<TonalDepthWhatsAppFormField, TonalDepthWhatsAppFieldMode>>;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * Runs after validation, with the composed message and the fields behind it.
   * Return `false` to stop the hand-off — for a consent gate, say. Anything
   * else lets WhatsApp open.
   */
  onSend?: (message: string, values: TonalDepthWhatsAppFormValues) => boolean | void;
}

const TonalDepthEMPTY: TonalDepthWhatsAppFormValues = {
  name: "", email: "", phone: "", subject: "", company: "", industry: "", service: "", message: "", page: "",
  custom: {},
};

/* Deliberately loose. A stricter pattern rejects real addresses — plus
   addressing, new TLDs, quoted locals — and the only thing that ever proves an
   address is sending to it. This catches the typo, not the exotic. */
const TonalDepthEMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Detect the reader's country from `navigator.language`. Free, synchronous,
 * needs no permission, and is right most of the time. Falls back to IN.
 *
 * **Privacy:** This reads a value the browser already exposes to every page.
 * Nothing is sent anywhere — the country prefills the dial-code picker, and
 * the reader can change it.
 */
function TonalDepthcountryFromLocale(): string {
  if (typeof navigator === "undefined") return "IN";
  const lang = navigator.language ?? "";
  const match = lang.match(/[-_]([A-Za-z]{2})$/);
  if (match) {
    const iso = match[1]!.toUpperCase();
    if (PHONE_COUNTRIES.some(c => c.iso === iso)) return iso;
  }
  return "IN";
}

/**
 * The message, in the order a person reads one.
 *
 * Only what was actually filled in. A run of "Company: —" lines makes the
 * message look like a form rather than like somebody writing to you — which
 * is also what makes a turned-off field cost nothing here: it is empty, so it
 * was already being skipped.
 */
function TonalDepthcompose(values: TonalDepthWhatsAppFormValues, custom: TonalDepthWhatsAppCustomField[] = []): string {
  const lines: string[] = [];
  if (values.subject) lines.push(`*${values.subject}*`, "");
  for (const [field, label] of TonalDepthLINES) {
    if (values[field]) lines.push(`${label}: ${values[field]}`);
  }
  /* After the built-ins and before the free text, in the order they were
     declared — a custom field is another labelled answer, and the reader of
     the message should not be able to tell which half of the form it came
     from. `messageLabel` exists because a form's label and a message's label
     want different lengths: "Fleet size" on screen, "Number of vehicles" in
     the message a stranger reads. */
  for (const field of custom) {
    const answer = values.custom[field.id];
    if (answer) lines.push(`${field.messageLabel ?? (typeof field.label === "string" ? field.label : field.id)}: ${answer}`);
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
 * ## Five named forms, and questions of your own
 *
 * `variant` picks one of `TonalDepthWHATSAPP_FORM_VARIANTS` — `enquiry` (the default,
 * and the form exactly as it shipped), `quick`, `callback`, `quote`,
 * `support`. A variant is a FIELD SET with a name, not a new component: all
 * five TonalDepthcompose the same message and hand it to the same `wa.me`, because
 * "which questions" is the only thing that actually differs between a quote
 * request and a callback request.
 *
 * `extraFields` adds questions the eight built-ins do not cover — "Fleet
 * size", "Preferred slot" — drawn, validated and written into the message the
 * way a built-in is. Between the two, a form that needs a different shape does
 * not need a different component.
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
 *
 * ## Phone country detection
 *
 * The phone field detects the reader's country from `navigator.language` and
 * prefills the dial-code picker. This is free, synchronous, needs no
 * permission, and is right most of the time. The reader can change it.
 *
 * **Privacy:** Nothing leaves the browser. The locale is already exposed to
 * every page, and the detected country is a prefilled default, not a claim.
 * `navigator.geolocation` is deliberately NOT called on mount — a permission
 * prompt that fires because a dialog opened is the fastest way to get the
 * permission denied permanently for the origin.
 */
export const TonalDepthWhatsAppForm = forwardRef<HTMLDivElement, TonalDepthWhatsAppFormProps>(function TonalDepthWhatsAppForm(
  {
    phone,
    label = "WhatsApp us",
    variant = "enquiry",
    title,
    description = "Fill this in and it opens WhatsApp with the message ready to send. Nothing is submitted here.",
    submitLabel,
    extraFields,
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
  const [values, setValues] = useState<TonalDepthWhatsAppFormValues>(TonalDepthEMPTY);
  const [phoneValue, setPhoneValue] = useState<PhoneValue>(() => emptyPhone(TonalDepthcountryFromLocale()));
  const [errors, setErrors] = useState<Partial<Record<keyof TonalDepthWhatsAppFormValues, string>>>({});
  const [customErrors, setCustomErrors] = useState<Record<string, string>>({});
  const [optionalOpen, setOptionalOpen] = useState(false);

  const spec = TonalDepthWHATSAPP_FORM_VARIANTS[variant] ?? TonalDepthWHATSAPP_FORM_VARIANTS.enquiry;
  const heading = title ?? spec.title;
  const send = submitLabel ?? spec.submitLabel;

  /* Merged rather than replaced, so `fields` names only what differs from the
     chosen variant. Passing the whole record would make every caller restate
     eight decisions to change one, and a caller who forgets a key would find
     the field silently gone rather than left alone. */
  const mode = { ...spec.fields, ...fields };
  const shown = TonalDepthROWS.flat().filter(field => mode[field] !== "off");

  /* A custom id that shadows a built-in is refused rather than honoured: a
     second `phone` would render a plain text box over the field that owns the
     dial-code picker and the E.164 composition, and the message would then
     carry two Phone lines that disagree. Unconditional rather than dev-only,
     like IconButton's — it only fires on a real defect. */
  const custom = (extraFields ?? []).filter(field => {
    if (!TonalDepthBUILT_IN.has(field.id)) return true;
    console.warn(`TonalDepthWhatsAppForm: extraFields id "${field.id}" is a built-in field name — use \`fields\` to turn that one on instead.`);
    return false;
  });
  const customShown = custom.filter(field => (field.mode ?? "optional") !== "off");

  const setOpen = (next: boolean) => {
    if (open === undefined) setUncontrolled(next);
    onOpenChange?.(next);
    if (!next) {
      setValues(TonalDepthEMPTY);
      setPhoneValue(emptyPhone(TonalDepthcountryFromLocale()));
      setErrors({});
      setCustomErrors({});
      setOptionalOpen(false);
    }
  };

  const setCustom = (id: string) => (value: string) => {
    setValues(current => ({ ...current, custom: { ...current.custom, [id]: value } }));
    setCustomErrors(current => (current[id] ? { ...current, [id]: undefined as unknown as string } : current));
  };

  const set = (key: keyof TonalDepthWhatsAppFormValues) => (value: string) => {
    setValues(current => ({ ...current, [key]: value }));
    setErrors(current => (current[key] ? { ...current, [key]: undefined } : current));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const found: Partial<Record<keyof TonalDepthWhatsAppFormValues, string>> = {};
    const customErrors: Record<string, string> = {};
    for (const field of shown) {
      if (field === "phone") {
        const digits = phoneValue.national.replace(/\D/g, "");
        if (!digits && mode[field] === "required") { found.phone = TonalDepthMISSING.phone; continue; }
        if (digits && digits.length < 7) { found.phone = "That does not look like a phone number."; continue; }
        continue;
      }
      const value = values[field].trim();
      if (!value) {
        if (mode[field] === "required") found[field] = TonalDepthMISSING[field];
        continue;
      }
      if (field === "email" && !TonalDepthEMAIL.test(value)) found.email = "That does not look like an email address.";
    }
    for (const field of customShown) {
      const value = (values.custom[field.id] ?? "").trim();
      if (!value) {
        if ((field.mode ?? "optional") === "required") {
          customErrors[field.id] = field.missing ?? "This one is needed.";
        }
        continue;
      }
      if (field.kind === "email" && !TonalDepthEMAIL.test(value)) customErrors[field.id] = "That does not look like an email address.";
    }
    if (Object.keys(found).length || Object.keys(customErrors).length) {
      setErrors(found);
      setCustomErrors(customErrors);
      return;
    }

    const captured = includePage
      ? page ?? (typeof window === "undefined" ? "" : window.location.href)
      : "";
    const filled = { ...values, phone: phoneValue.e164, page: captured };
    for (const field of TonalDepthROWS.flat()) if (mode[field] === "off") filled[field] = "";
    /* A turned-off custom field leaves the message the same way a turned-off
       built-in does — the answer may still be in state from before it was
       switched off, and a message must only ever carry what the form asked. */
    filled.custom = Object.fromEntries(customShown.map(field => [field.id, values.custom[field.id] ?? ""]));
    const message = TonalDepthcompose(filled, customShown);
    if (onSend?.(message, filled) === false) return;

    const number = phone.replace(/\D/g, "");
    const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    if (typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  const choice = (key: "industry" | "service", options: string[] | undefined, placeholder: string) =>
    options ? (
      <span className="td-registry-wa-select">
        <select
          className="td-registry-wa-native"
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
  const draw = (field: TonalDepthWhatsAppFormField) => {
    const id = `${base}-${field}`;
    const isRequired = mode[field] === "required";
    const shared = { htmlFor: id, error: errors[field], ...(isRequired ? { required: true } : { optional: true }) };
    const onChange = (event: { target: { value: string } }) => set(field)(event.target.value);
    if (field === "phone") {
      return (
        <FormField key={field} label="Phone" {...shared} htmlFor={`${base}-phone-number`}>
          <PhoneField
            id={`${base}-phone-number`}
            value={phoneValue}
            onValueChange={next => {
              setPhoneValue(next);
              set("phone")(next.e164);
            }}
            invalid={Boolean(errors.phone)}
          />
        </FormField>
      );
    }
    if (field === "industry" || field === "service") {
      return <FormField key={field} label={field === "industry" ? "Industry" : "Service required"} {...shared}>
        {choice(field, field === "industry" ? industries : services, field === "industry" ? "Choose an industry" : "Choose a service")}
      </FormField>;
    }
    if (field === "message") {
      return <FormField key={field} label="Anything else" {...shared}>
        <Textarea id={id} rows={2} value={values.message} onChange={onChange} />
      </FormField>;
    }
    const TYPES: Partial<Record<TonalDepthWhatsAppFormField, { type?: string; autoComplete?: string }>> = {
      name: { autoComplete: "name" },
      email: { type: "email", autoComplete: "email" },
      company: { autoComplete: "organization" },
    };
    const LABELS: Partial<Record<TonalDepthWhatsAppFormField, string>> = {
      name: "Name", email: "Email", subject: "Subject", company: "Company",
    };
    return <FormField key={field} label={LABELS[field]} {...shared}>
      <Input id={id} {...TYPES[field]} value={values[field]} onChange={onChange} />
    </FormField>;
  };

  /** A caller's own field, drawn with the same housing a built-in one gets. */
  const drawCustom = (field: TonalDepthWhatsAppCustomField) => {
    const id = `${base}-x-${field.id}`;
    const isRequired = (field.mode ?? "optional") === "required";
    const shared = { htmlFor: id, error: customErrors[field.id], ...(isRequired ? { required: true } : { optional: true }) };
    const answer = values.custom[field.id] ?? "";
    const onChange = (event: { target: { value: string } }) => setCustom(field.id)(event.target.value);
    if (field.kind === "textarea") {
      return <FormField key={field.id} label={field.label} {...shared}>
        <Textarea id={id} rows={2} placeholder={field.placeholder} value={answer} onChange={onChange} />
      </FormField>;
    }
    if (field.kind === "choice") {
      return <FormField key={field.id} label={field.label} {...shared}>
        <span className="td-registry-wa-select">
          <select
            className="td-registry-wa-native"
            id={id}
            value={answer}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setCustom(field.id)(event.target.value)}
          >
            <option value="">{field.placeholder ?? "Choose one"}</option>
            {(field.options ?? []).map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        </span>
      </FormField>;
    }
    const TYPE: Partial<Record<NonNullable<TonalDepthWhatsAppCustomField["kind"]>, string>> = { email: "email", tel: "tel", number: "number" };
    return <FormField key={field.id} label={field.label} {...shared}>
      <Input id={id} type={field.kind ? TYPE[field.kind] : undefined} placeholder={field.placeholder} value={answer} onChange={onChange} />
    </FormField>;
  };

  /* Built-ins in their fixed rows, then the caller's own, each on its own
     line. Custom fields are appended rather than interleaved because the rows
     above are a designed pairing — name beside phone, email beside subject —
     and a caller cannot know which half of a pair it would be joining. */
  const block = (want: TonalDepthWhatsAppFieldMode) => [
    ...TonalDepthROWS
      .map(row => row.filter(field => mode[field] === want))
      .filter(row => row.length > 0)
      .map(row => row.length > 1
        ? <div className="td-registry-wa-row" key={row.join("-")}>{row.map(draw)}</div>
        : draw(row[0])),
    ...customShown.filter(field => (field.mode ?? "optional") === want).map(drawCustom),
  ];

  const optional = block("optional");
  const optionalLabelId = `${base}-optional-label`;

  return (
    <div {...props} ref={ref} className={cx("td-registry-wa", className)}>
      {trigger === false
        ? null
        : trigger
          ? trigger({ open: () => setOpen(true), isOpen })
          : <Button variant="whatsapp" onClick={() => setOpen(true)}>{label}</Button>}

      <Dialog
        open={isOpen}
        onOpenChange={setOpen}
        title={heading}
        description={description}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="whatsapp" type="submit" form={`${base}-form`}>{send}</Button>
          </>
        }
      >
        <form id={`${base}-form`} className="td-registry-wa-form" onSubmit={submit} noValidate>
          {block("required")}

          {optional.length ? (
            <fieldset className={cx("td-registry-wa-optional", optionalOpen && "td-registry-wa-optional--open")} aria-labelledby={optionalLabelId}>
              <button
                type="button"
                id={optionalLabelId}
                className="td-registry-wa-optional-toggle"
                onClick={() => setOptionalOpen(!optionalOpen)}
                aria-expanded={optionalOpen}
              >
                <span className="td-registry-wa-optional-label">Optional</span>
                <span className="td-registry-wa-optional-hint">it only changes who picks the message up</span>
                <span className="td-registry-wa-optional-chevron" aria-hidden="true" />
              </button>
              {optionalOpen ? optional : null}
            </fieldset>
          ) : null}

          {includePage ? (
            <p className="td-registry-wa-page">
              The page you are on is added to the message, so we know what you were reading.
            </p>
          ) : null}
        </form>
      </Dialog>
    </div>
  );
});
