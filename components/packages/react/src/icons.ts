"use client";

// Phosphor builds an `IconContext` at module scope, so evaluating this module
// in a React Server Component throws `createContext is not a function`. Several
// server-renderable components here import icons (CaseCard, ComparisonTable),
// and their pages died collecting data. The boundary belongs on the icons, not
// on the cards: a server component may render a client one. It stays here even
// as TD glyphs take over roles, because the Phosphor fallback is still a
// module-scope import of this file.
/**
 * The system's icon set — TD first, Phosphor for everything else.
 *
 * Every UI icon in TonalDepth comes from here, and no component draws its own
 * `<svg>`. Two libraries feed this module, in a fixed order:
 *
 * 1. **TD** (`./td-icons`) — the library's own glyphs. **It resolves first.**
 * 2. **Phosphor** — the fallback for every role TD does not define, which is
 *    still most of them.
 *
 * TD is not a free-for-all second icon set. A role moves to TD only when
 * Phosphor has no glyph for it, or when the one it has reads badly at the size
 * the system uses it. Nothing else is added: not Lucide, not Heroicons, not
 * Font Awesome, not an emoji. The only exception is artwork that is not an
 * icon — a company logo, a product mark — which is passed in as a prop by the
 * consuming app.
 *
 * Precedence is structural, not a convention: a role is exported exactly once,
 * from exactly one of the two blocks below, and `TD_ICON_ROLES` names the TD
 * half. `tooling/tests/test_surface_parity.py` fails if the two ever disagree
 * or if a role is claimed twice.
 *
 * ## Weight
 *
 * `fill` is the house weight, and it is not a stylistic preference. The lamp
 * pattern ([[L15]]) makes the icon carry a control's whole state through its
 * colour and a `drop-shadow` glow, and a glow traces the alpha edge of what it
 * is applied to — an outline glyph glows as a hollow outline, which reads as a
 * smudge rather than a lit filament. A solid mark glows as a solid mark. TD
 * glyphs are filled by construction and accept `weight` only so they drop into
 * a call site that was rendering a Phosphor icon.
 *
 * Weights other than `fill` are exported for non-lamp uses: a `regular`
 * chevron in a menu is decoration, not state.
 *
 * ## Sizing and colour
 *
 * Icons take `size="1em"` so they scale with the type they sit beside, and
 * `color="currentColor"` so they inherit from the component — which is what
 * lets a lamp's ramp move them without the icon knowing about it. Do not set a
 * pixel size or a literal colour on an icon inside a component; set the font
 * size or the colour on the element that owns it. A TD glyph is stripped of
 * every hardcoded fill on the way in for the same reason.
 *
 * ## Adding one
 *
 * Import the component here — from `./td-icons` if TD draws it, from Phosphor
 * otherwise — re-export it under a role name, and use the role name
 * everywhere. The indirection is the point: a component says what the icon is
 * *for*, and swapping the glyph is a one-line change in this file rather than
 * a search across the package. A role that moves between the two libraries
 * moves without any component being touched.
 */

export type { IconProps, IconWeight } from "@phosphor-icons/react";
export type { TdIconProps } from "./td-icons";

// ── TD — resolved first ──────────────────────────────────────────────────
// These three roles are drawn by the library. Everything else falls through
// to the Phosphor block below.
export {
  // Phosphor's circled check reads as a badge rather than an act of approval,
  // and it is the same mark as SuccessIcon — an accept button and a success
  // alert should not be the same glyph.
  TdCheckFat as AcceptIcon,
  // Refusing and dismissing are different acts, and on Phosphor both were
  // XCircle. TD draws each of them.
  TdCancel as CancelIcon,
  // Phosphor has no bare cross that survives `fill`: its X renders as a filled
  // square plate with the mark knocked out, and its XCircle is a solid disc
  // that reads as a hole punched in the surface at the size a dismiss control
  // uses.
  TdClose as CloseIcon,
  TdWhatsApp as WhatsAppIcon,
  // Phosphor's star is an outline at `fill` and pinches at the 14px a rating
  // uses. Ratings are the only place the system draws one, and it has to be a
  // solid mark for the half-star clip to read.
  TdStar as StarIcon,
} from "./td-icons";

/**
 * The roles TD draws, for anything that has to tell the two apart — the docs
 * icon index marks provenance from this list.
 *
 * Kept beside the export block rather than derived from it, because ES module
 * exports are not introspectable at runtime. A parity test asserts this list
 * is exactly the set of roles the `./td-icons` export block claims, so the
 * duplication cannot drift.
 */
export const TD_ICON_ROLES = ["AcceptIcon", "CancelIcon", "CloseIcon", "StarIcon", "WhatsAppIcon"] as const;

// ── Phosphor — the fallback ──────────────────────────────────────────────
export {
  // ── Actions ────────────────────────────────────────────────────────────
  // Solid by construction, not by weight. Phosphor's `fill` on a stroke-only
  // glyph (Check, X, Plus, Caret) renders a filled SQUARE PLATE with the mark
  // knocked out of it — which is why a plain CheckIcon came out as a checkbox.
  // The Circle forms are genuinely solid shapes, so they take the lamp's glow
  // as a solid mark, which is the whole point of the fill rule.
  TrashIcon as DeleteIcon,
  PlusIcon as AddIcon,
  PencilSimpleIcon as EditIcon,
  DownloadSimpleIcon as DownloadIcon,
  ArrowRightIcon as ArrowRightIcon,
  ArrowUpRightIcon as ArrowOutIcon,
  CaretDownIcon as ChevronDownIcon,
  CaretRightIcon as ChevronRightIcon,
  CaretLeftIcon as ChevronLeftIcon,
  MagnifyingGlassIcon as SearchIcon,
  // Two stacked sheets — a shape rather than a stroke, so `fill` renders it as
  // two solid plates rather than knocking the mark out of one.
  CopyIcon as CopyIcon,

  // ── Selection ──────────────────────────────────────────────────────────
  // The mark inside a checked box, kept on the circled check while accept
  // buttons moved to the TD tick. A checkbox is a state, not an act.
  CheckCircleIcon as CheckboxMarkIcon,

  // ── Channels ───────────────────────────────────────────────────────────
  PhoneIcon as CallIcon,
  EnvelopeSimpleIcon as EmailIcon,
  LinkedinLogoIcon as LinkedInIcon,
  FacebookLogoIcon as FacebookIcon,
  InstagramLogoIcon as InstagramIcon,
  XLogoIcon as XIcon,
  YoutubeLogoIcon as YouTubeIcon,

  // ── Status ─────────────────────────────────────────────────────────────
  InfoIcon as InfoIcon,
  WarningIcon as WarningIcon,
  WarningCircleIcon as ErrorIcon,
  CheckCircleIcon as SuccessIcon,
  CircleIcon as DotIcon,

  // ── Theme ──────────────────────────────────────────────────────────────
  SunIcon as SunIcon,
  MoonIcon as MoonIcon,

  // ── Generic UI (previews, menus, demos) ────────────────────────────────
  SquaresFourIcon as SquaresFourIcon,
  GearIcon as GearIcon,
  BellIcon as BellIcon,
  ChatCircleIcon as ChatCircleIcon,
  CubeIcon as CubeIcon,
  ListIcon as ListIcon,
  EnvelopeSimpleIcon as EnvelopeSimpleIcon,
  PhoneIcon as PhoneIcon,

  // ── Files and documents ────────────────────────────────────────────────
  // A tree says folder-or-file with its glyph, so the two must read apart at
  // 12px. Phosphor's folder and page are both solid silhouettes at `fill`,
  // which is what the row's ink ladder needs to move them.
  FolderIcon as FolderIcon,
  FileIcon as FileIcon,

  // ── Reading ────────────────────────────────────────────────────────────
  ClockIcon as ReadTimeIcon,
  CalendarBlankIcon as DateIcon,

  // ── What a piece carries ───────────────────────────────────────────────
  // ArticleCard's "In this piece" chips take their glyph from the asset's
  // kind. `live` and `download` reuse DotIcon and DownloadIcon above — a
  // running tool is a state, and a download is a download — so only the two
  // kinds with nothing to borrow are named here.
  ChartBarIcon as DatasetIcon,
  CursorClickIcon as InteractiveIcon,
} from "@phosphor-icons/react";

/**
 * The weight every icon that acts as a lamp must use.
 *
 * Exported as a constant rather than typed at each call site so the rule is
 * enforceable — `tooling/tests` asserts that lamp icons carry it.
 */
export const LAMP_WEIGHT = "fill" as const;
