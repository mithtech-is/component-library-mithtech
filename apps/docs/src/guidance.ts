/**
 * What each component is FOR — the half of the documentation a props table
 * cannot carry, and the corpus the search runs against.
 *
 * It lives beside `main.tsx` rather than inside each `Doc` entry for one
 * reason: it has to be complete. Keyed off the doc id and made the source of
 * `Doc["id"]`, an entry with no guidance is a **type error** rather than a page
 * that quietly reads as thinner than the others.
 *
 * ## Writing `useCases`
 *
 * These are jobs, phrased the way somebody types them into a search box —
 * "show migration progress", "compare two plans". Not feature words. The search
 * weights this field highest precisely so that a reader who does not know the
 * library's vocabulary can still find the component: "show a migration" has to
 * find `Timeline` though no name contains any of those words. Feature nouns
 * ("axis", "variant", "tone") make the field useless, because someone who knows
 * to type those already knows which component they want.
 *
 * ## Writing `whenNotToUse`
 *
 * This is the field that stops the next duplicate. Twenty-one near-duplicate
 * slots accumulated in the design system because nothing in the docs said "you
 * already have this" — so every near neighbour points at its sibling BY ID and
 * says what actually differs, in terms of what the reader does with it.
 */

export interface Guidance {
  /** Plain-language jobs. The search corpus, weighted highest. */
  useCases: string[];
  /**
   * What this is called everywhere else.
   *
   * A reader arrives with the vocabulary of the last design system they used:
   * they type "modal", "accordion", "snackbar", "fab", "cmdk". None of those
   * words appears in our names or our `useCases`, which are jobs rather than
   * nouns — so without this the search fails the people most likely to need
   * it, and they conclude the component does not exist and build a second one.
   *
   * Weighted alongside the name, because a synonym IS the name to whoever is
   * typing it.
   */
  aliases?: string[];
  /** One sentence: what this is for. */
  whenToUse: string;
  /** The near neighbours, by doc id, and what actually separates them. */
  whenNotToUse?: { instead: string; because: string }[];
  /** For a family: which axis answers which question. */
  variants?: { name: string; when: string }[];
}

export const GUIDANCE = {
  /* ── Actions ──────────────────────────────────────────────────────── */
  "button": {
    aliases: ["cta", "action button", "submit button", "primary button"],
    useCases: ["submit a form", "trigger an action", "add a call to action", "confirm or cancel something", "link that looks like a button"],
    whenToUse: "The default control for any action — the one to reach for unless something below says otherwise.",
    whenNotToUse: [
      { instead: "icon-button", because: "The control is a glyph with no words, or a glyph whose label must not change colour with the state. An icon-only Button has no accessible name." },
      { instead: "split-button", because: "There is a primary action AND a short list of alternatives to it. Two buttons side by side make the reader choose before they have read either." },
      { instead: "filament-button", because: "It is one of a row of mutually exclusive choices that stays put — a sideways tab, not a thing that happens when pressed." },
      { instead: "confirm-button", because: "The action is destructive and should ask once before it fires." },
    ],
    variants: [
      { name: "primary", when: "The surface housing with the lamp lit — the design system's own primary. Most buttons." },
      { name: "filled", when: "The papaya fill. One per screen at most; it is the loudest thing the system can say." },
      { name: "secondary", when: "Beside a primary, where both are real options." },
      { name: "outline / ghost", when: "In a toolbar or a dense row, where a full housing each would be a wall of plates." },
      { name: "link", when: "Inside a sentence. It is a button that has to sit in running text." },
    ],
  },
  "icon-button": {
    aliases: ["fab", "round button", "glyph button"],
    useCases: ["icon only button", "toolbar button", "button with an icon and a label", "copy or share button"],
    whenToUse: "A control whose icon carries the state — round and wordless in a toolbar, or a pill at CTA height when it has a label.",
    whenNotToUse: [
      { instead: "button", because: "The words are the point and the icon is decoration. Button's lamp is a hint; this one's is the signal." },
      { instead: "theme-toggle", because: "It is specifically the light/dark switch, which already ships with the sun/moon swap wired." },
      { instead: "social-button", because: "It is a link out to somebody else's platform. That one carries the marks and the owners' current colours; this one's glyph rides a state ladder, which a trademark must not." },
    ],
    variants: [
      { name: "neutral", when: "A carved housing whose lamp lights green. The default." },
      { name: "papaya / azure / invert", when: "A filled housing, where the button IS the call to action." },
      { name: "*-quiet", when: "A ROW of channels — six filled discs is a wall of fills; six quiet ones read as one material with six lights in it." },
    ],
  },
  "filament-button": {
    aliases: ["vertical tab", "sideways tab", "segmented item"],
    useCases: ["sideways tab", "vertical tab strip", "pick one of several modes", "rail of options down the side"],
    whenToUse: "One option in a row of mutually exclusive ones, where the row stays on screen and the choice is visible in it.",
    whenNotToUse: [
      { instead: "button", because: "The control makes something happen and then it is over. A filament reports a standing choice." },
      { instead: "tabs", because: "You want the whole tab set and its panels wired for you, along the top." },
    ],
  },
  "split-button": {
    aliases: ["dropdown button", "menu button", "action with options"],
    useCases: ["a main action with alternatives", "save and save as", "deploy with options", "button with a dropdown"],
    whenToUse: "There is one obvious action and two or three variations on it that would clutter the row as separate buttons.",
    whenNotToUse: [
      { instead: "dropdown-menu", because: "None of the options is the obvious default. A split button promises that pressing the big half is the right move." },
      { instead: "button", because: "There is only one action. A menu with one item is a button with an extra press in it." },
    ],
  },
  "confirm-button": {
    aliases: ["are you sure", "destructive confirm", "hold to confirm"],
    useCases: ["ask before deleting", "confirm a destructive action", "are you sure button", "undo-able delete"],
    whenToUse: "A destructive but recoverable action — delete a build, roll back a deploy — where a dialog would be more ceremony than the act deserves.",
    whenNotToUse: [
      { instead: "dialog", because: "The action is genuinely unrecoverable — an account, a customer, a ledger. An inline confirm is a speed bump, not informed consent, and there is nowhere to explain the consequence." },
      { instead: "button", because: "The action is reversible or harmless. Asking about everything trains the reader to press twice without reading." },
    ],
  },
  "theme-toggle": {
    aliases: ["dark mode switch", "light dark toggle", "appearance toggle"],
    useCases: ["switch between light and dark", "dark mode button"],
    whenToUse: "The light/dark switch, in the header or the footer.",
  },
  "copy-chip": {
    aliases: ["copy to clipboard", "copy button", "snippet chip"],
    useCases: ["copy to clipboard", "copy a command", "copy an API key", "copy button with feedback"],
    whenToUse: "Beside anything the reader will want in their clipboard rather than retyped.",
    whenNotToUse: [
      { instead: "code-block", because: "The thing being copied is a listing — CodeBlock already carries this chip in its corner." },
    ],
  },

  /* ── Forms ────────────────────────────────────────────────────────── */
  "input": {
    aliases: ["text field", "textbox", "form input"],
    useCases: ["single line text field", "email field", "collect a name"],
    whenToUse: "One line of text.",
    whenNotToUse: [
      { instead: "textarea", because: "The answer runs to more than a line." },
      { instead: "search-bar", because: "The field filters something already on the page and needs the search affordances." },
    ],
  },
  "textarea": {
    aliases: ["multiline input", "comment box", "long text field"],
    useCases: ["multi line text", "message box", "collect a long answer", "comment field"],
    whenToUse: "An answer that runs to several lines.",
    whenNotToUse: [{ instead: "input", because: "One line is enough. A tall box asks for a long answer whether you wanted one or not." }],
  },
  "form-field": {
    aliases: ["label and error", "field wrapper", "form row"],
    useCases: ["label a form field", "show a validation error", "add hint text to an input"],
    whenToUse: "Around every control in a form — it owns the label, the hint and the error, and wires them to the input for a screen reader.",
  },
  "checkbox": {
    aliases: ["tickbox", "check mark input", "multi select box"],
    useCases: ["opt in", "accept terms", "tick several options", "on off setting in a form"],
    whenToUse: "Independent yes/no choices, where any number can be on.",
    whenNotToUse: [
      { instead: "radio", because: "Exactly one of the set may be chosen." },
      { instead: "switch", because: "The change takes effect immediately rather than on submit." },
    ],
  },
  "radio": {
    aliases: ["radio group", "single choice", "option button"],
    useCases: ["pick exactly one", "choose a plan", "single choice from a short list"],
    whenToUse: "One of a small set, all visible at once.",
    whenNotToUse: [
      { instead: "dropdown-menu", because: "The list is long enough that showing it all costs more than a press." },
      { instead: "checkbox", because: "More than one may be chosen." },
    ],
  },
  "switch": {
    aliases: ["toggle", "on off", "checkbox toggle"],
    useCases: ["turn a setting on or off", "enable a feature", "immediate toggle"],
    whenToUse: "A setting that takes effect the moment it is flipped.",
    whenNotToUse: [{ instead: "checkbox", because: "Nothing happens until the form is submitted. A switch that needs a Save button lies about when it took effect." }],
  },
  "range": {
    aliases: ["slider", "input range", "scrubber"],
    useCases: ["pick a number on a scale", "budget slider", "set a quantity roughly"],
    whenToUse: "A number where the approximate position matters more than the exact figure.",
    whenNotToUse: [{ instead: "input", because: "The reader knows the exact value they want. A slider makes typing 1,247 into a drag." }],
  },
  "search-bar": {
    aliases: ["search field", "search input", "typeahead", "autocomplete", "combobox"],
    useCases: ["search a page", "filter a list as you type", "find something by name", "search with suggestions"],
    whenToUse: "An inline field that narrows what is already in front of the reader.",
    whenNotToUse: [
      { instead: "spotlight", because: "The results go somewhere else — pages, records, commands. A search bar narrows; a palette navigates." },
      { instead: "filter-bar", because: "The narrowing is by category rather than by text." },
    ],
  },
  "filter-bar": {
    aliases: ["chips", "facets", "filter chips", "tag filter"],
    useCases: ["filter a table by category", "narrow results by status", "chips that filter a list"],
    whenToUse: "A row of category filters above a table or a list.",
    whenNotToUse: [{ instead: "search-bar", because: "The reader is looking for one thing by name rather than narrowing by category." }],
  },
  "multi-step": {
    aliases: ["wizard", "stepper", "multi page form", "onboarding flow"],
    useCases: ["a form in several steps", "wizard", "onboarding flow", "checkout steps", "show which step of a form you are on"],
    whenToUse: "A form long enough that showing it all at once would put the reader off, where the sequence is fixed and the reader moves through it.",
    whenNotToUse: [
      { instead: "timeline", because: "The reader only READS the sequence — they are not moving through it. Timeline reports; this one is operated." },
      { instead: "tabs", because: "The panes can be visited in any order. Steps imply you must finish one to reach the next." },
    ],
  },
  "forms": {
    aliases: ["form layout", "form example"],
    useCases: ["build a form", "lay out labels and fields", "form validation errors"],
    whenToUse: "The overview page: how the form controls fit together and who owns the label, the hint and the error.",
  },

  /* ── Feedback ─────────────────────────────────────────────────────── */
  "alert": {
    aliases: ["callout", "banner", "inline message", "notice"],
    useCases: ["show a warning on the page", "explain why something failed", "inline notice", "success message"],
    whenToUse: "A message that belongs to the page and stays there while it is true.",
    whenNotToUse: [
      { instead: "toast", because: "The message is about something that just happened and should get out of the way by itself." },
      { instead: "dialog", because: "The reader has to answer before anything else can happen." },
    ],
  },
  "toast": {
    aliases: ["snackbar", "notification", "flash message", "transient message"],
    useCases: ["confirm something saved", "show a background job finished", "temporary notification", "undo a delete"],
    whenToUse: "Feedback on an action the reader has already taken, which should disappear on its own.",
    whenNotToUse: [{ instead: "alert", because: "The condition persists. A toast that says 'your card expired' vanishes before it has been dealt with." }],
  },
  "progress": {
    aliases: ["progress bar", "loading bar", "meter", "determinate loader"],
    useCases: ["show a percentage complete", "upload progress", "show migration progress", "how far through a job", "show a quota being used", "deadline status"],
    whenToUse: "A quantity, with a number attached — how much of something is done, used or elapsed.",
    whenNotToUse: [
      { instead: "timeline", because: "What matters is WHICH step, not how much. A meter cannot say 'schema copy failed'." },
      { instead: "reading-progress", because: "It is the reader's position in an article, where the number is not the point and there is nothing to label." },
      { instead: "counter", because: "The number is a finished statistic rather than a fraction of something." },
    ],
    variants: [
      { name: "value", when: "A real fraction is known." },
      { name: "indeterminate", when: "The total genuinely is not known. Never as a decoration over a number you have." },
      { name: "status", when: "The number needs a verdict — 'On track', 'Overdue'. This is the compliance and deadline form." },
    ],
  },
  "reading-progress": {
    aliases: ["scroll progress", "read indicator", "page progress"],
    useCases: ["show how far down an article you are", "reading indicator", "bar at the top of a blog post", "scroll progress"],
    whenToUse: "The thin bar across the top of a long piece, so the reader can feel their position without looking at it.",
    whenNotToUse: [
      { instead: "progress", because: "The number is the point and the meter belongs to a job rather than to the reader's scroll position." },
    ],
  },
  "feedback": {
    aliases: ["status patterns", "feedback example"],
    useCases: ["tell the reader something happened", "choose between an alert and a toast"],
    whenToUse: "The overview page: which feedback surface answers which situation.",
  },

  /* ── Overlays ─────────────────────────────────────────────────────── */
  "dialog": {
    aliases: ["modal", "popup", "overlay window", "confirmation dialog", "alert dialog"],
    useCases: ["ask before deleting", "confirm an irreversible action", "modal window", "a form in a popup"],
    whenToUse: "The reader has to deal with something before the page can continue.",
    whenNotToUse: [
      { instead: "confirm-button", because: "The act is recoverable and the ceremony is not earned." },
      { instead: "toast", because: "Nothing is being asked — it is just news." },
    ],
  },
  "tooltip": {
    aliases: ["hint", "title attribute", "hover label", "popover hint"],
    useCases: ["explain what a button does", "hover hint", "preview a record before clicking", "show details on hover"],
    whenToUse: "A short explanation of a control, or — at variant peek — a preview of a record so the reader can decide whether to follow the link.",
    whenNotToUse: [
      { instead: "dialog", because: "The reader needs to act on what they see. A tooltip vanishes when the pointer leaves, so nothing in it can be clicked, selected or copied." },
      { instead: "alert", because: "The message matters whether or not anyone hovers." },
    ],
    variants: [
      { name: "hint", when: "A line of text explaining a control." },
      { name: "peek", when: "A preview card of a record — headline facts, so the reader can decide whether the jump is worth it." },
    ],
  },
  "spotlight": {
    aliases: ["command palette", "cmdk", "search console", "quick search", "omnibox", "launcher"],
    useCases: ["command palette", "cmd k search", "search the whole site", "jump to a page or an action", "global search"],
    whenToUse: "A search over the whole product that takes the screen and whose results go somewhere.",
    whenNotToUse: [
      { instead: "search-bar", because: "The field belongs to the page and filters what is already on it. A reader reaches for one to narrow and the other to leave." },
      { instead: "dropdown-menu", because: "The set of choices is short and fixed. A palette earns its keep when the list is too long to show." },
    ],
  },
  "dropdown-menu": {
    aliases: ["select", "picker", "menu", "combo", "options list"],
    useCases: ["pick from a list", "a menu of actions", "select an option", "overflow menu"],
    whenToUse: "A short list of options or actions behind one trigger.",
    whenNotToUse: [
      { instead: "radio", because: "The list is short enough to show all at once, and seeing the options matters." },
      { instead: "split-button", because: "One of the options is clearly the default." },
    ],
  },

  /* ── Navigation ───────────────────────────────────────────────────── */
  "site-navigation": {
    aliases: ["navbar", "header", "top nav", "main menu", "masthead"],
    useCases: ["site header", "public website navbar", "mega menu navigation", "sticky header"],
    whenToUse: "The header of a public marketing site — brand, links, mega panels, and the sticky retract behaviour.",
    whenNotToUse: [{ instead: "application-shell", because: "The page is inside a signed-in product, where navigation is a sidebar and there are no mega panels." }],
  },
  "footer": {
    aliases: ["site footer", "page foot", "bottom nav"],
    useCases: ["site footer", "link columns at the bottom", "contact details and social links"],
    whenToUse: "The bottom of a public site.",
  },
  "breadcrumbs": {
    aliases: ["crumb trail", "path nav", "you are here"],
    useCases: ["show where you are in a hierarchy", "path back to the parent page", "trail of parent pages"],
    whenToUse: "The page sits inside a hierarchy the reader may want to climb.",
    whenNotToUse: [{ instead: "sub-nav", because: "The links are siblings rather than ancestors." }],
  },
  "pagination": {
    aliases: ["pager", "page numbers", "next previous"],
    useCases: ["page through a long list", "next and previous page", "jump to page 5"],
    whenToUse: "A list too long for one page, where the reader may want a specific page.",
  },
  "toc": {
    aliases: ["table of contents", "on this page", "outline", "anchor nav"],
    useCases: ["table of contents", "jump to a section of an article", "on this page links"],
    whenToUse: "Beside a long document, so the reader can see its shape and jump within it.",
    whenNotToUse: [{ instead: "sub-nav", because: "The links go to other pages rather than to sections of this one." }],
  },
  "tabs": {
    aliases: ["tab bar", "tabbed panels", "segmented control"],
    useCases: ["switch between panels", "show one section at a time", "tabbed content"],
    whenToUse: "Two to five panels of comparable content, switched along the top.",
    whenNotToUse: [
      { instead: "side-tabs", because: "There are more than about five, or their labels are too long to fit across the top — a vertical strip has room to grow, a horizontal one does not." },
      { instead: "sub-nav", because: "Each entry is a different PAGE. Tabs own a value; navigation is the router's answer." },
    ],
  },
  "side-tabs": {
    aliases: ["vertical tabs", "rail tabs", "sidebar tabs"],
    useCases: ["vertical tabs", "tabs down the side", "switch between many sections", "settings panel navigation"],
    whenToUse: "The same job as Tabs where the list is long or the labels are wordy.",
    whenNotToUse: [
      { instead: "tabs", because: "There are only a few, with short labels — a horizontal row reads faster and costs no width." },
      { instead: "sub-nav", because: "The entries navigate rather than switching a panel in place." },
    ],
  },
  "page-nav": {
    aliases: ["secondary header", "sub header", "section tabs", "page tabs", "sticky nav"],
    useCases: ["secondary navigation bar", "tabs under the page header", "section navigation that sticks", "switch between views of one record", "sub navigation for mobile"],
    whenToUse: "The horizontal bar under the site header that moves between sections of the page you are already on, and stays put while you scroll.",
    whenNotToUse: [
      { instead: "sub-nav", because: "The links are a grouped directory in a sidebar rather than a strip across the top. Grouped headings need vertical room; this bar has none." },
      { instead: "tabs", because: "Nothing navigates — the panel switches in place and the component owns which one is showing. Here every item is a URL and the router decides." },
      { instead: "toc", because: "The destinations are headings inside one document rather than separate pages." },
      { instead: "site-navigation", because: "It is the top-level site header. This one sits underneath it and stacks with it." },
    ],
  },
  "chat-launcher": {
    aliases: ["chat widget", "live chat", "support bubble", "help button", "ask ai", "intercom", "messenger", "ai halo", "halo", "unread badge", "chat teaser"],
    useCases: ["live chat button", "floating help button", "chat widget in the corner", "ask AI button", "support bubble", "show unread messages", "mark a control as AI", "revolving shine around a button"],
    whenToUse: "A conversation the reader can open without leaving what they are doing — support, sales, or an AI assistant.",
    whenNotToUse: [
      { instead: "dialog", because: "The answer is required before anything else can happen. A dialog scrims the page and traps focus; a chat panel deliberately does neither." },
      { instead: "icon-button", because: "It is a control in the page's own flow rather than a fixed affordance that follows the reader down it, and there is no panel behind it." },
      { instead: "toast", because: "The system is telling the reader something, rather than offering to be spoken to." },
    ],
    variants: [
      { name: "presence", when: "online, away or offline — the lamp, and the words a screen reader gets. Say the truth; an always-green lamp is worse than none." },
      { name: "ai", when: "The channel is an assistant rather than a person. Adds the revolving halo, which is the only continuously moving thing the library ships." },
    ],
  },
  "sub-nav": {
    aliases: ["sidebar nav", "secondary nav", "settings nav", "left nav"],
    useCases: ["settings sidebar", "second level navigation", "grouped links with counts", "navigate within a section"],
    whenToUse: "Second-level navigation inside a section of a product — grouped links, each going to its own page.",
    whenNotToUse: [
      { instead: "side-tabs", because: "Nothing navigates; the panel switches in place." },
      { instead: "application-shell", because: "You want the whole page frame, not just the links. The shell renders this component for its sidebar." },
    ],
  },

  /* ── Mega menus ───────────────────────────────────────────────────── */
  "mega-cascade": {
    aliases: ["mega menu", "three column menu", "cascading menu", "nested menu"],
    useCases: ["mega menu with nested categories", "browse a deep menu", "drill into subcategories from the navbar"],
    whenToUse: "A mega panel whose content is a hierarchy the reader drills into.",
    whenNotToUse: [{ instead: "mega-grid", because: "The options are a flat set of peers with no nesting." }],
  },
  "mega-tabs": {
    aliases: ["mega menu", "two column menu", "menu with panes"],
    useCases: ["mega menu split by audience", "menu panel with its own tabs"],
    whenToUse: "A mega panel whose content splits cleanly into a few named groups.",
  },
  "mega-grid": {
    aliases: ["mega menu", "menu cards", "panel of cards"],
    useCases: ["mega menu of feature cards", "flat grid of menu options"],
    whenToUse: "A mega panel holding a flat set of peer options as cards.",
    whenNotToUse: [{ instead: "mega-cascade", because: "The options nest." }],
  },
  "mega-columns": {
    aliases: ["mega menu", "link columns", "wide menu", "footer style menu"],
    useCases: ["mega menu in columns", "menu with a featured panel"],
    whenToUse: "A mega panel laid out in columns, with the first making the case.",
  },

  /* ── Surfaces & data ──────────────────────────────────────────────── */
  "card": {
    aliases: ["surface", "panel", "tile", "container"],
    useCases: ["group related content", "a box on the page", "surface for a small amount of content"],
    whenToUse: "A general-purpose raised surface, when the content has no measured object in it.",
    whenNotToUse: [
      { instead: "frame", because: "Something MEASURED goes inside — a chart, a table, a specimen, a transcript. A frame cuts a well for it, and the depth is what tells the reader data from chrome." },
      { instead: "feature-card", because: "It is one of a set of things being sold, with an icon and a title." },
    ],
  },
  "frame": {
    aliases: ["figure", "housing", "chart container", "well"],
    useCases: ["house a chart", "put a table in a box", "show a specimen", "container with a recessed well"],
    whenToUse: "Anything measured — a chart, a wide table, a transcript, a code listing — goes in a frame's well, with its caption on the plate.",
    whenNotToUse: [
      { instead: "card", because: "The content is prose or controls rather than a measured object. A well around a paragraph says 'this is data' about something that is not." },
      { instead: "chart-container", because: "It is specifically a chart with a legend — that component is this one with the plot's slots already wired." },
    ],
  },
  "table": {
    aliases: ["data grid", "rows and columns", "list view", "datatable"],
    useCases: ["show rows of data", "a data grid", "sortable list of records"],
    whenToUse: "Records with several fields each, compared down columns.",
    whenNotToUse: [
      { instead: "data-list", because: "It is one record's fields rather than many records. A two-column table of label and value is a definition list wearing a table." },
      { instead: "comparison-table", because: "The argument is which option to choose rather than what the data says." },
    ],
  },
  "data-list": {
    aliases: ["definition list", "key value", "record details", "dl"],
    useCases: ["show a record's fields", "key value pairs", "specification list", "label and value rows"],
    whenToUse: "One thing's attributes, as label-and-value rows.",
    whenNotToUse: [
      { instead: "kpi", because: "The numbers are the headline and each deserves its own tile with a trend. A DataList is a reference; a KPI row is a dashboard." },
      { instead: "table", because: "There are many records to compare down columns." },
    ],
  },
  "kpi": {
    aliases: ["stat", "metric card", "big number", "scorecard"],
    useCases: ["dashboard metrics", "show a number with its trend", "headline figures", "stat tiles"],
    whenToUse: "The headline numbers of a dashboard, each with its movement.",
    whenNotToUse: [
      { instead: "data-list", because: "The values are reference facts rather than metrics — nothing is trending and nothing needs a tile." },
      { instead: "counter", because: "It is a marketing page, where the number is the argument and there is no delta or sparkline to carry." },
    ],
  },
  "counter": {
    aliases: ["animated number", "count up", "odometer", "rolling number"],
    useCases: ["animated statistic", "hero stats", "big number that counts up", "show a headline figure on a marketing page"],
    whenToUse: "A statistic on a marketing page, at display size, counting up when it is scrolled to.",
    whenNotToUse: [
      { instead: "kpi", because: "It is inside a product. KpiCard carries a delta, a trend and a sparkline, and it is server-renderable." },
      { instead: "progress", because: "The number is a fraction of something rather than a finished fact." },
    ],
  },
  "chart-container": {
    aliases: ["chart wrapper", "graph housing", "plot frame"],
    useCases: ["house a chart with a legend", "wrap a graph", "chart with a title and a source line"],
    whenToUse: "Around a plot, with its legend, title and source line already wired.",
    whenNotToUse: [{ instead: "frame", because: "There is no legend and no plot — you just need the plate and the well." }],
  },
  "code-block": {
    aliases: ["code snippet", "syntax highlight", "pre", "code sample"],
    useCases: ["show a code sample", "install command", "show a config file", "show a diff", "before and after code"],
    whenToUse: "Source the reader will copy and run — or, in diff mode, a change they are reviewing.",
    whenNotToUse: [
      { instead: "terminal", because: "It is the record of a run rather than source. Copying a transcript — prompts, spinners and timings — is not a thing anyone wants." },
      { instead: "prose", because: "It is a few words of code inside a sentence; Prose already styles inline code." },
    ],
    variants: [
      { name: "default", when: "Source, with a copy control and an optional language." },
      { name: "diff", when: "A unified diff. Each line is marked by its first character, and the markers stay in the text so what is copied is still a diff." },
    ],
  },
  "terminal": {
    aliases: ["console", "shell output", "command line", "cli transcript"],
    useCases: ["show command output", "deploy log", "build log", "show what a command printed", "console transcript"],
    whenToUse: "The record of something that ran — output the reader is reading to find out what happened.",
    whenNotToUse: [
      { instead: "code-block", because: "It is source to be copied and run. A terminal has no copy control because a transcript is not something you paste anywhere." },
    ],
  },
  "file-tree": {
    aliases: ["directory tree", "folder tree", "repo browser", "explorer"],
    useCases: ["show a folder structure", "project layout", "directory listing", "where files go"],
    whenToUse: "A directory structure, so the reader can see where things live.",
  },
  "file-preview": {
    aliases: ["attachment", "file card", "upload list", "document preview"],
    useCases: ["show an attached document", "pdf preview", "download a file", "attachment row", "show a document with its size and page count"],
    whenToUse: "A document offered for opening or downloading, with its facts and its actions.",
    whenNotToUse: [
      { instead: "file-tree", because: "It is a structure of many files rather than one document being offered." },
      { instead: "frame", because: "The thing in the well is a chart or a table rather than a document, and there is nothing to download." },
    ],
  },
  "map": {
    aliases: ["locator", "geo", "office locations", "pins"],
    useCases: ["show where an office is", "plot locations", "pins on a map", "coverage area"],
    whenToUse: "Locations shown in relation to each other. No tile provider, no network, no projection.",
  },
  "prose": {
    aliases: ["rich text", "article body", "markdown styles", "typography"],
    useCases: ["style an article", "long form content", "blog post body", "style markdown output", "inline code in a sentence", "definition list"],
    whenToUse: "Around any block of authored copy — it styles headings, lists, tables, blockquotes, definition lists and inline code without a class on any of them.",
    whenNotToUse: [{ instead: "code-block", because: "The code is a listing to be copied rather than a phrase inside a sentence." }],
  },
  "rect-title": {
    aliases: ["display heading", "hero title", "rectangle title", "big type"],
    useCases: ["big display heading", "balanced headline", "the rectangle title treatment"],
    whenToUse: "A display heading where the block should read as a rectangle — the treatment the design system is named for.",
  },
  "badge": {
    aliases: ["pill", "tag", "label", "chip", "status pill"],
    useCases: ["show a status", "label a category", "count in a corner", "tag"],
    whenToUse: "A short label carrying a status or a category.",
    whenNotToUse: [{ instead: "alert", because: "There is something to explain. A badge has room for a word." }],
  },

  /* ── App patterns ─────────────────────────────────────────────────── */
  "application-shell": {
    aliases: ["app layout", "dashboard shell", "admin layout", "sidebar layout"],
    useCases: ["app layout with a sidebar", "signed in product frame", "dashboard shell"],
    whenToUse: "The frame of a signed-in product — sidebar, page head, content.",
    whenNotToUse: [
      { instead: "site-navigation", because: "It is a public marketing page, which needs mega panels and a sticky retract." },
      { instead: "sub-nav", because: "You only want the grouped links, not the whole page frame." },
    ],
  },
  "page-patterns": {
    aliases: ["page template", "dashboard page", "empty state", "layout preset"],
    useCases: ["standard dashboard page", "empty state", "loading state", "data management page layout"],
    whenToUse: "The recurring page shapes inside a product, including the empty and error states.",
  },
  "timeline": {
    aliases: ["roadmap", "activity feed", "history", "phases", "changelog", "milestones"],
    useCases: ["show a sequence of stages", "roadmap", "project phases", "activity feed", "show migration progress", "build pipeline status", "what happened recently", "order status", "show which step failed"],
    whenToUse: "A thing moving through ordered states, where WHICH state matters — four different slots resolve here on the axis prop.",
    whenNotToUse: [
      { instead: "progress", because: "What matters is how MUCH is done rather than which step it is on. A meter cannot say 'schema copy failed'." },
      { instead: "multi-step", because: "The reader moves through the sequence rather than reading it." },
    ],
    variants: [
      { name: "elapsed", when: "A history. The time trails the row as a machine value — '2 weeks ago', 'week 8'." },
      { name: "period", when: "A roadmap. The planning window leads the item — 'Q4 2025' — because the period is what the reader scans down." },
      { name: "flow", when: "A pipeline, read across. The question is 'where did it stop' — a build's stages, an order draft to fulfilled." },
      { name: "feed", when: "An activity stream. The mark is the person rather than a state, and nothing is upcoming." },
      { name: "marker=ordinal", when: "A plan whose steps get referred to by number. A done step shows a tick instead." },
    ],
  },

  /* ── Marketing ────────────────────────────────────────────────────── */
  "article-card": {
    aliases: ["blog card", "post card", "news card"],
    useCases: ["blog index", "link to an article", "show what a piece contains", "news listing"],
    whenToUse: "One piece of writing in an index, including the shelf of what it ships with.",
    whenNotToUse: [
      { instead: "case-card", because: "It is a piece of WORK with outcomes, not a piece of writing. A case card leads with numbers; an article card leads with a headline and a read time." },
      { instead: "feature-card", because: "Nothing is being linked to — it is a capability being described." },
    ],
  },
  "case-card": {
    aliases: ["case study", "success story", "portfolio card"],
    useCases: ["case study", "show a client outcome", "portfolio entry", "show what a project achieved"],
    whenToUse: "A piece of work with measurable outcomes — the metrics are the argument.",
    whenNotToUse: [
      { instead: "article-card", because: "It is something written rather than something delivered." },
      { instead: "feature-card", because: "It describes a capability you offer rather than a job you finished." },
      { instead: "testimonial", because: "The evidence is somebody's words rather than a number." },
    ],
  },
  "feature-card": {
    aliases: ["service card", "benefit card", "capability tile", "product card"],
    useCases: ["list what you offer", "services grid", "product capabilities", "what is included", "three column feature grid"],
    whenToUse: "A capability or a service, with an icon, a title and a few points. With FeatureGrid columns=2 this is also the services tile.",
    whenNotToUse: [
      { instead: "case-card", because: "There is a real outcome with numbers behind it — proof beats a claim." },
      { instead: "pricing-table", because: "Each option has a price and something to act on." },
    ],
  },
  "testimonial": {
    aliases: ["quote", "review", "customer quote", "social proof"],
    useCases: ["customer quote", "what clients say", "social proof", "show a recommendation"],
    whenToUse: "Somebody's words as evidence for a claim, with their name and role underneath.",
    whenNotToUse: [
      { instead: "profile-card", because: "The subject is the PERSON — you go to a profile card to find out who someone is. Here the person is the evidence for the quote." },
      { instead: "case-card", because: "The proof is a measured outcome rather than an opinion." },
    ],
  },
  "profile-card": {
    aliases: ["team card", "person card", "avatar card", "bio card", "author card"],
    useCases: ["team page", "show who someone is", "author bio", "staff directory"],
    whenToUse: "A person as the subject — who they are and how to reach them.",
    whenNotToUse: [{ instead: "testimonial", because: "What matters is what they SAID. Swap them round and a testimonial becomes a team card with a long bio." }],
  },
  "comparison-table": {
    aliases: ["feature matrix", "versus table", "spec comparison", "plan comparison"],
    useCases: ["compare options", "us versus them", "feature comparison", "compare two approaches", "before and after"],
    whenToUse: "An argument laid out in columns, where the reader is weighing options and there is nothing to act on.",
    whenNotToUse: [
      { instead: "pricing-table", because: "Each column is an OFFER with a price and a call to action. A pricing table is something to buy; a comparison table is something to think about." },
      { instead: "table", because: "It is data rather than an argument." },
    ],
  },
  "pricing-table": {
    aliases: ["plans", "price cards", "tiers", "packages", "subscription plans"],
    useCases: ["show plans and prices", "pricing page", "compare plans and sign up", "subscription tiers"],
    whenToUse: "Plans with prices, each with its own call to action.",
    whenNotToUse: [
      { instead: "comparison-table", because: "There is nothing to buy — the reader is being convinced, not asked to choose a plan." },
    ],
  },
  "faq": {
    aliases: ["accordion", "disclosure", "expander", "collapsible", "questions"],
    useCases: ["frequently asked questions", "expand and collapse answers", "accordion", "hide detail until asked for"],
    whenToUse: "Questions and answers, or any list where the answers are long enough that showing them all would bury the questions.",
    whenNotToUse: [{ instead: "prose", because: "There are only two or three short answers — collapsing them hides them for no gain." }],
  },
  "social-button": {
    aliases: ["social links", "social icons", "share buttons", "follow buttons", "linkedin button", "x button", "brand icons"],
    useCases: ["link to a social profile", "follow us row in a footer", "social links on a profile card", "share to a platform"],
    whenToUse: "Linking out to a profile or a channel, where the platform's own mark is what the reader is looking for.",
    whenNotToUse: [
      { instead: "IconButton", because: "It is an action of yours rather than a link to somebody else's platform — copy, share, download. Those take the neutral lamp housing." },
      { instead: "LogoStrip", because: "The logos are clients or partners being shown rather than links being offered." },
    ],
    variants: [
      { name: "brand", when: "The platform's colour on the housing, so the button reads as the logo. The default, and what a short row on a profile card wants." },
      { name: "surface", when: "The carved neutral housing with the mark in the platform's colour, arriving fully on hover. For a long footer row, where a dozen saturated chips would out-shout the page." },
    ],
  },
  "whatsapp-form": {
    aliases: ["whatsapp us", "whatsapp button", "whatsapp enquiry", "contact form", "enquiry form", "chat on whatsapp", "click to chat"],
    useCases: ["let visitors message us on whatsapp", "capture an enquiry without a backend", "contact form that opens whatsapp", "sales enquiry from a marketing page"],
    whenToUse: "A channel your readers already trust, where you want the enquiry structured but do not want to run an inbox for it. The form composes the message; the reader sends it from their own account.",
    whenNotToUse: [
      { instead: "a posted form", because: "The enquiry has to be received whether or not the reader completes the hand-off. Nothing here reaches a server of yours." },
      { instead: "ChatLauncher", because: "You want a conversation in the page rather than a message handed to another app." },
    ],
  },
  "cta-banner": {
    aliases: ["call to action", "promo banner", "conversion band"],
    useCases: ["call to action band", "get in touch section", "closing prompt at the end of a page"],
    whenToUse: "The band that asks for the next step, usually at the end of a page.",
  },
  "logo-strip": {
    aliases: ["client logos", "logo wall", "logo cloud", "trusted by", "partner logos"],
    useCases: ["client logos", "logo wall", "who we work with", "scrolling logos"],
    whenToUse: "Real client or partner artwork as third-party proof.",
  },
  "link-cells": {
    aliases: ["related links", "next steps", "link grid", "read more"],
    useCases: ["grid of links", "explore more pages", "related links block"],
    whenToUse: "A grid of onward links with no other content in them.",
  },
  "iso-stack": {
    aliases: ["layered card", "stacked cards", "depth stack"],
    useCases: ["stacked cards", "show a body of work", "deck of cards that fans out", "show that there are several of something"],
    whenToUse: "The COUNT is the point — 'there is a body of this work' — and the individual entries are secondary.",
    whenNotToUse: [
      { instead: "case-card", because: "The reader needs to compare the entries. Overlapping them hides most of each one." },
      { instead: "feature-card", because: "Each entry has to be read, not glanced at." },
    ],
  },

  /* ── Family pages ─────────────────────────────────────────────────── */
  "ordered-states": {
    aliases: ["state machine", "status flow", "ordered statuses"],
    useCases: ["show a thing moving through stages", "show migration progress", "build pipeline status", "workflow stages", "draft submitted cancelled", "order status", "roadmap", "activity feed", "which step is it on", "step indicator"],
    whenToUse: "The decision page for anything that moves through ordered states — five slots resolve here, and this is where you find out which one you have.",
    whenNotToUse: [
      { instead: "progress", because: "Only the quantity matters and no step has a name." },
    ],
  },

  /* ── Form fields, added 2026-08-30 ─────────────────────────────────── */
  "select": {
    aliases: ["dropdown", "picker", "option list", "native select"],
    useCases: ["pick one option from a short list", "choose a category", "set a status", "country dropdown"],
    whenToUse: "One choice from a handful of known options — under about twenty, where the reader can read the whole list.",
    whenNotToUse: [
      { instead: "combobox", because: "The list is long enough that the reader is scanning rather than reading. A filter is the fix, and a native select cannot carry one." },
      { instead: "radio", because: "There are three or four options and they all matter enough to stay on screen. A select hides its options until pressed." },
      { instead: "dropdown-menu", because: "The entries are actions, not values. A select sets a field; a menu does something." },
    ],
  },
  "combobox": {
    aliases: ["autocomplete", "typeahead", "searchable select", "multiselect", "multi-select", "tags from a list"],
    useCases: ["search a long list of options", "pick a country", "filter as you type", "pick several from a list", "assign people to something"],
    whenToUse: "One choice — or several with `multiple` — from a list too long to read, where typing narrows it.",
    whenNotToUse: [
      { instead: "select", because: "The list is short. A filter over eight options is furniture the reader has to look past." },
      { instead: "tag-input", because: "The reader invents the values rather than picking them. This one only offers what you gave it." },
      { instead: "search-bar", because: "The query searches content and the result is a page, not a value set in a field." },
    ],
    variants: [
      { name: "single", when: "One value. The field shows the chosen label when it is not being typed in." },
      { name: "multiple", when: "Several. Chips appear above the field, the same chip TagInput uses — this IS the multi-select." },
    ],
  },
  "tag-input": {
    aliases: ["tags", "chips input", "keywords", "token input", "labels"],
    useCases: ["add keywords", "tag a record", "enter a list of emails", "type several values into one field"],
    whenToUse: "Several short values the reader makes up — keywords, labels, addresses — committed one at a time.",
    whenNotToUse: [
      { instead: "combobox", because: "The values come from a list you control. Free text where a closed set was meant produces four spellings of the same tag." },
      { instead: "textarea", because: "It is prose. Tags are separate values; a paragraph is one." },
    ],
  },
  "date-picker": {
    aliases: ["calendar", "date field", "datepicker", "choose a date"],
    useCases: ["pick a date", "set a deadline", "choose a birthday", "schedule something for a day"],
    whenToUse: "One day, with no time of day. The value is `YYYY-MM-DD`, so it does not move when the reader does.",
    whenNotToUse: [
      { instead: "date-range-picker", because: "The reader is choosing a span — a report period, a stay. Two single pickers let them pick an end before the start." },
      { instead: "date-time-picker", because: "The time of day matters. A meeting at 'Tuesday' is not scheduled." },
      { instead: "time-picker", because: "Only the clock matters and the day is already known." },
    ],
  },
  "time-picker": {
    aliases: ["time field", "clock", "hour picker", "choose a time"],
    useCases: ["pick a time of day", "set an appointment slot", "choose opening hours", "set a reminder time"],
    whenToUse: "A time of day on a known date. Hour and minute grids, so any time is two presses.",
    whenNotToUse: [
      { instead: "date-time-picker", because: "The day is not already fixed. Two separate fields let the reader set a time against no date." },
      { instead: "date-picker", because: "Only the day matters." },
    ],
  },
  "date-range-picker": {
    aliases: ["date range", "period picker", "from and to dates", "reporting period"],
    useCases: ["choose a reporting period", "pick check-in and check-out", "filter a dashboard by date", "select a span of days"],
    whenToUse: "A start and an end, on one calendar that fills them in turn — and quick spans for the questions readers actually ask.",
    whenNotToUse: [
      { instead: "date-picker", because: "It is one day. A range with both ends the same is a worse way to say that." },
      { instead: "filter-bar", because: "The date span is one filter among several and belongs in the bar with them." },
    ],
  },
  "date-time-picker": {
    aliases: ["datetime", "timestamp picker", "schedule", "when picker"],
    useCases: ["schedule a meeting", "set a publish time", "pick an exact moment", "book a slot on a day"],
    whenToUse: "A precise instant — the calendar and the time grid in one popover, so the reader sets both without closing anything.",
    whenNotToUse: [
      { instead: "date-picker", because: "The time of day does not matter, and asking for it invents a 00:00 nobody chose." },
      { instead: "date-range-picker", because: "It is a span, not a moment." },
    ],
  },
  "file-upload": {
    aliases: ["dropzone", "file picker", "attach a file", "image upload", "avatar upload", "drag and drop files"],
    useCases: ["upload a document", "attach files to a form", "upload an image", "add a profile photo", "drag files in"],
    whenToUse: "The reader hands over one or more files. `preview` draws thumbnails, which is what makes it an image upload.",
    whenNotToUse: [
      { instead: "file-preview", because: "The file is already there and the job is to show it, not to collect it." },
    ],
    variants: [
      { name: "default", when: "Any file. The list names what was picked and how big it is." },
      { name: 'accept="image/*" preview', when: "The image upload. Same zone, same keyboard path, plus a thumbnail per file — this IS the image upload." },
      { name: "multiple", when: "More than one at a time. Without it a second pick replaces the first." },
    ],
  },
  "otp-input": {
    aliases: ["one time code", "verification code", "2fa code", "pin entry", "sms code"],
    useCases: ["enter a verification code", "two-factor authentication", "confirm a code from an SMS", "enter a PIN"],
    whenToUse: "A short code, one cell per character, where the reader wants to see the digits land separately.",
    whenNotToUse: [
      { instead: "input", because: "The code is long or free-form. Six boxes for a password is a puzzle." },
    ],
  },
  "rating": {
    aliases: ["stars", "star rating", "score", "review score", "five stars"],
    useCases: ["show an average review score", "let someone rate something", "display a star rating", "collect feedback out of five"],
    whenToUse: "A score out of a small maximum, shown or collected. `readOnly` is the display form and honours halves.",
    whenNotToUse: [
      { instead: "progress", because: "It is a proportion of a task, not a judgement. Progress is measured; a rating is given." },
      { instead: "range", because: "The scale is continuous and has units. Stars are ordinal and have none." },
    ],
    variants: [
      { name: "readOnly", when: "An average someone else produced. Halves render; nothing is focusable." },
      { name: "interactive", when: "The reader's own score. A radio group under the hood, so arrows set it." },
    ],
  },
  "color-picker": {
    aliases: ["colour picker", "swatch picker", "brand colour", "palette"],
    useCases: ["pick a brand colour", "choose a label colour", "set a theme colour", "pick from a palette"],
    whenToUse: "A colour from a palette somebody curated. `allowCustom` adds the platform picker for the cases a hex has to be typed.",
    whenNotToUse: [
      { instead: "select", because: "The options are named things that happen to have colours — a status, a category. Then the name is the value and the colour is decoration." },
    ],
  },
  "number-field": {
    aliases: ["number input", "stepper", "quantity", "spinner", "currency field", "price field", "percent field", "amount"],
    useCases: ["set a quantity", "enter an amount of money", "enter a percentage", "increase or decrease a number", "set a price"],
    whenToUse: "A number the reader types or nudges. A `prefix` or `suffix` makes it the currency or percent field — no separate component.",
    whenNotToUse: [
      { instead: "range", because: "The reader is choosing roughly where on a scale, not stating an exact figure. A slider cannot say 4,50,000." },
      { instead: "input", because: "The value is a code that happens to be digits — a PIN, an invoice number. Those must not be nudgeable." },
    ],
    variants: [
      { name: 'prefix="₹"', when: "Money. The symbol sits in Input's leading slot — this IS the currency field." },
      { name: 'suffix="%"', when: "A percentage. Trailing slot — this IS the percent field." },
      { name: "precision", when: "Fixed decimals when the field is not being typed in, so a column of amounts lines up." },
    ],
  },
  "phone-field": {
    aliases: ["telephone", "mobile number", "country code", "dial code", "tel input"],
    useCases: ["enter a phone number", "collect a mobile number", "pick a country dialling code", "capture a WhatsApp number"],
    whenToUse: "A phone number that has to reach a real network — the country is picked, not typed, and the value comes back as E.164.",
    whenNotToUse: [
      { instead: "input", because: "The number is internal and never dialled — an extension, a desk number. Then the country selector is 239 rows of noise." },
    ],
  },
  "address-field": {
    aliases: ["postal address", "billing address", "shipping address", "street address"],
    useCases: ["collect a delivery address", "enter a billing address", "capture a postal address", "add a location to a record"],
    whenToUse: "A whole postal address as one value, in the order each line narrows the next — country, then state, then city.",
    whenNotToUse: [
      { instead: "input", because: "One line is all that is wanted. This asks for six." },
    ],
  },
  "checkbox-group": {
    aliases: ["multiple checkboxes", "checkbox list", "select many", "multi choice"],
    useCases: ["choose several options", "tick multiple boxes", "select all that apply", "set several preferences at once"],
    whenToUse: "Several checkboxes read as one question, in a fieldset with a legend so the group has a name.",
    whenNotToUse: [
      { instead: "radio", because: "Exactly one answer is allowed. Checkboxes say 'any number, including none'." },
      { instead: "combobox", because: "The list is long. Fifteen checkboxes is a wall; a filtered multi-select is a field." },
      { instead: "checkbox", because: "It is one independent switch — a consent box — not one of a set." },
    ],
  },
  "range-dual": {
    aliases: ["range slider", "min max slider", "price range", "two thumbs", "between filter"],
    useCases: ["filter by price range", "set a minimum and maximum", "choose a band", "narrow results between two values"],
    whenToUse: "A span on a scale — both ends set by dragging, with the pair kept in order whichever thumb moved.",
    whenNotToUse: [
      { instead: "range", because: "Only one end is being set. A second thumb pinned to the maximum is a slider pretending to be a filter." },
      { instead: "number-field", because: "The reader knows the exact figures. A slider makes them hunt for 4,50,000." },
    ],
  },

  /* ── Patterns ─────────────────────────────────────────────────────── */
  "lamp": {
    aliases: ["glow", "icon glow", "hover glow", "lit icon", "drop-shadow state", "filament"],
    useCases: ["make an icon show state on hover", "add a glow to a button icon", "show a control is pressed", "light an icon without changing its colour meaning"],
    whenToUse: "The technique every icon-carrying control uses to report state: unlit at rest, lit on hover, brighter on press. Read this before adding a glow to anything.",
    whenNotToUse: [
      { instead: "icon-button", because: "You want the component, not the technique. That page is the control; this one is why its glyph behaves the way it does." },
      { instead: "social-button", because: "The mark is a trademark. It lights, but it must not take a state colour — that page records the one exception." },
    ],
    variants: [
      { name: "off", when: "Rest. Two explicit zero shadows, never `none`." },
      { name: "hover", when: "Lit — the colour lifts and a soft bloom appears." },
      { name: "active", when: "Pressed — a solid core plus a wide halo." },
    ],
  },
} satisfies Record<string, Guidance>;

/**
 * Every id the docs may use. A `Doc` whose id is not a key here fails to
 * typecheck, which is what makes "every entry carries guidance" a build rule
 * rather than a good intention.
 */
export type GuidedId = keyof typeof GUIDANCE;
