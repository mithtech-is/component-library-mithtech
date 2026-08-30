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
}

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
};

/* Deliberately loose. A stricter pattern rejects real addresses — plus
   addressing, new TLDs, quoted locals — and the only thing that ever proves an
   address is sending to it. This catches the typo, not the exotic. */
const TonalDepthEMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Seven digits is the shortest national number in use anywhere; punctuation
   and a country code are allowed through and normalised later. */
const TonalDepthPHONE = /^\+?[\d\s().-]{7,}

/** The message, in the order a person reads one. */
function TonalDepthcompose(values: TonalDepthWhatsAppFormValues): string {
  const lines = [
    `*${values.subject}*`,
    "",
    `Name: ${values.name}`,
    `Email: ${values.email}`,
    `Phone: ${values.phone}`,
  ];
  // Only what was actually filled in. A run of "Company: —" lines makes the
  // message look like a form rather than like somebody writing to you.
  if (values.company) lines.push(`Company: ${values.company}`);
  if (values.industry) lines.push(`Industry: ${values.industry}`);
  if (values.service) lines.push(`Service required: ${values.service}`);
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
 */
export const TonalDepthWhatsAppForm = forwardRef<HTMLDivElement, TonalDepthWhatsAppFormProps>(function TonalDepthWhatsAppForm(
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
  const [errors, setErrors] = useState<Partial<Record<keyof TonalDepthWhatsAppFormValues, string>>>({});

  const setOpen = (next: boolean) => {
    if (open === undefined) setUncontrolled(next);
    onOpenChange?.(next);
    // A form the reader abandoned should not be waiting for them, half filled,
    // the next time they open it.
    if (!next) { setValues(TonalDepthEMPTY); setErrors({}); }
  };

  const set = (key: keyof TonalDepthWhatsAppFormValues) => (value: string) => {
    setValues(current => ({ ...current, [key]: value }));
    // Clearing on edit rather than re-validating on every keystroke: a message
    // that disappears the moment you start fixing it is encouraging, and one
    // that updates while you type mid-word is nagging.
    setErrors(current => (current[key] ? { ...current, [key]: undefined } : current));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const found: Partial<Record<keyof TonalDepthWhatsAppFormValues, string>> = {};
    if (!values.name.trim()) found.name = "Tell us who you are.";
    if (!values.email.trim()) found.email = "We need somewhere to reply if WhatsApp fails.";
    else if (!TonalDepthEMAIL.test(values.email.trim())) found.email = "That does not look like an email address.";
    if (!values.phone.trim()) found.phone = "The number you are messaging from.";
    else if (!TonalDepthPHONE.test(values.phone.trim())) found.phone = "That does not look like a phone number.";
    if (!values.subject.trim()) found.subject = "One line on what this is about.";
    if (Object.keys(found).length) { setErrors(found); return; }

    /* The page is read HERE rather than in an effect on open, so it is right
       even in a single-page app where the reader navigated with the form
       already mounted — and so the component never touches `window` during
       render, which would break server rendering outright. */
    const captured = includePage
      ? page ?? (typeof window === "undefined" ? "" : window.location.href)
      : "";
    const filled = { ...values, page: captured };
    const message = TonalDepthcompose(filled);
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

  return (
    <div {...props} ref={ref} className={cx("td-registry-wa", className)}>
      <Button variant="whatsapp" onClick={() => setOpen(true)}>{label}</Button>

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
        <form id={`${base}-form`} className="td-registry-wa-form" onSubmit={submit} noValidate>
          <div className="td-registry-wa-row">
            <FormField label="Name" htmlFor={`${base}-name`} required error={errors.name}>
              <Input id={`${base}-name`} autoComplete="name" value={values.name}
                onChange={event => set("name")(event.target.value)} />
            </FormField>
            <FormField label="Phone" htmlFor={`${base}-phone`} required error={errors.phone}>
              <Input id={`${base}-phone`} type="tel" autoComplete="tel" value={values.phone}
                onChange={event => set("phone")(event.target.value)} />
            </FormField>
          </div>

          <FormField label="Email" htmlFor={`${base}-email`} required error={errors.email}>
            <Input id={`${base}-email`} type="email" autoComplete="email" value={values.email}
              onChange={event => set("email")(event.target.value)} />
          </FormField>

          <FormField label="Subject" htmlFor={`${base}-subject`} required error={errors.subject}>
            <Input id={`${base}-subject`} value={values.subject}
              onChange={event => set("subject")(event.target.value)} />
          </FormField>

          {/* The optional half is a carved WELL rather than a rule and a grey
              sentence. Depth is how this system says "subordinate": four more
              fields at the same weight as the four above read as a wall of
              eight, while the same four sitting IN the panel read as one
              thing the reader may skip. The fields inside keep their own
              `optional` tags, so nothing depends on seeing the recess. */}
          <fieldset className="td-registry-wa-optional">
            <legend className="td-registry-wa-optional-legend">Optional — it only changes who picks the message up</legend>

            <div className="td-registry-wa-row">
              <FormField label="Company" htmlFor={`${base}-company`} optional>
                <Input id={`${base}-company`} autoComplete="organization" value={values.company}
                  onChange={event => set("company")(event.target.value)} />
              </FormField>
              <FormField label="Industry" htmlFor={`${base}-industry`} optional>
                {choice("industry", industries, "Choose an industry")}
              </FormField>
            </div>

            <FormField label="Service required" htmlFor={`${base}-service`} optional>
              {choice("service", services, "Choose a service")}
            </FormField>

            <FormField label="Anything else" htmlFor={`${base}-message`} optional>
              <Textarea id={`${base}-message`} rows={3} value={values.message}
                onChange={event => set("message")(event.target.value)} />
            </FormField>
          </fieldset>

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
