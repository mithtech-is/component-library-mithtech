"use client";

// Phosphor builds an `IconContext` at module scope, so evaluating this module
// in a React Server Component throws `createContext is not a function`. Several
// server-renderable components here import icons (CaseCard, ComparisonTable),
// and their pages died collecting data. The boundary belongs on the icons, not
// on the cards: a server component may render a client one. It stays here even
// as TD glyphs take over roles, because the Phosphor fallback is still a
// module-scope import of this file.
/**
 * The system's icon set — TD first, Fluent for everything else.
 *
 * Every UI icon in TonalDepth comes from here, and no component draws its own
 * `<svg>`. Two libraries feed this module, in a fixed order:
 *
 * 1. **TD** (`./td-icons`) — the library's own glyphs. **It resolves first.**
 * 2. **Fluent** (`./fluent-icons`) — Microsoft's Fluent System Icons at filled
 *    weight, generated from `tooling/icons/manifest.json` and vendored from
 *    the CDN at build time. The fallback for every role TD does not define,
 *    which is still most of them.
 *
 * TD is not a free-for-all second icon set. A role moves to TD only when
 * Fluent has no glyph for it, or when the one it has reads badly at the size
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
 * Add a role to `tooling/icons/manifest.json` and re-run `pnpm icons:build`,
 * or draw it in `./td-icons` if Fluent has nothing that works — re-export it under a role name, and use the role name
 * everywhere. The indirection is the point: a component says what the icon is
 * *for*, and swapping the glyph is a one-line change in this file rather than
 * a search across the package. A role that moves between the two libraries
 * moves without any component being touched.
 */

/* The set's own prop shape, re-exported under the names the library has always
   used for it. `IconWeight` survives as a type because call sites pass
   `weight={LAMP_WEIGHT}` and components accept it — the marks here are filled
   by construction, so it is swallowed rather than honoured. */
export type { FluentIconProps as IconProps } from "./fluent-icons";
export type IconWeight = "fill";
export type { TdIconProps } from "./td-icons";

// ── TD — resolved first ──────────────────────────────────────────────────
// These roles are drawn by the library. Everything else falls through to the
// Fluent block below.
//
// Each was drawn against Phosphor, which this set replaced in
// `0.1.0-alpha.38`. The REQUIREMENT each one records still holds — it is about
// what the mark has to do at the size the system draws it, not about who drew
// the alternative — but whether Fluent now supplies an acceptable equivalent
// has not been re-checked role by role. That audit is worth doing before
// drawing an eighth.
export {
  // Must not be the same mark as SuccessIcon: an accept button and a success
  // alert are different statements. A circled check reads as a badge — a thing
  // something IS — rather than as an act of approval.
  TdCheckFat as AcceptIcon,
  // Refusing and dismissing are different acts and must not share a glyph.
  TdCancel as CancelIcon,
  // A bare cross. A filled plate with the mark knocked out of it, or a solid
  // disc, reads as a hole punched in the surface at the size a dismiss control
  // uses — which is the one move the system forbids.
  TdClose as CloseIcon,
  TdWhatsApp as WhatsAppIcon,
  // Ratings are the only place the system draws a star, and it has to be a
  // solid mark that holds its points at 14px for the half-star clip to read.
  TdStar as StarIcon,
  // The two marks a window's traffic lights draw. Both are rendered at about
  // 9px inside a 14px disc, where a thin bar resolves to a hairline and
  // disappears against a saturated fill — so both are drawn deliberately heavy
  // for that size. The close mark is `CloseIcon` above, the same bare cross.
  TdMinus as WindowMinimiseIcon,
  TdExpandCorners as WindowZoomIcon,
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
export const TD_ICON_ROLES = ["AcceptIcon", "CancelIcon", "CloseIcon", "StarIcon", "WhatsAppIcon", "WindowMinimiseIcon", "WindowZoomIcon"] as const;

// ── Fluent — the fallback ──────────────────────────────────────────────
export {
  // ── Actions ────────────────────────────────────────────────────────────
  // Solid by construction, not by weight. Phosphor's `fill` on a stroke-only
  // glyph (Check, X, Plus, Caret) renders a filled SQUARE PLATE with the mark
  // knocked out of it — which is why a plain CheckIcon came out as a checkbox.
  // The Circle forms are genuinely solid shapes, so they take the lamp's glow
  // as a solid mark, which is the whole point of the fill rule.
  DeleteIcon,
  AddIcon,
  EditIcon,
  DownloadIcon,
  ArrowRightIcon,
  ArrowOutIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  SearchIcon,
  // Two stacked sheets — a shape rather than a stroke, so `fill` renders it as
  // two solid plates rather than knocking the mark out of one.
  CopyIcon,

  // ── Selection ──────────────────────────────────────────────────────────
  // The mark inside a checked box, kept on the circled check while accept
  // buttons moved to the TD tick. A checkbox is a state, not an act.
  CheckboxMarkIcon,

  // ── Channels ───────────────────────────────────────────────────────────
  CallIcon,
  EmailIcon,
  LinkedInIcon,
  FacebookIcon,
  InstagramIcon,
  XIcon,
  YouTubeIcon,

  // ── Status ─────────────────────────────────────────────────────────────
  InfoIcon,
  WarningIcon,
  ErrorIcon,
  SuccessIcon,
  DotIcon,

  // ── Theme ──────────────────────────────────────────────────────────────
  SunIcon,
  MoonIcon,

  // ── Generic UI (previews, menus, demos) ────────────────────────────────
  SquaresFourIcon,
  GearIcon,
  BellIcon,
  ChatCircleIcon,
  CubeIcon,
  ListIcon,
  // The overflow role, for what did not fit: a bottom bar's "More", a row's
  // own menu. Three discs at `fill` — a solid mark that glows as a mark, where
  // an ellipsis of outlines would glow as three smudges.
  MoreIcon,
  EnvelopeSimpleIcon,
  PhoneIcon,
  // Where a thing is. AddressField's "use my location" control.
  LocationIcon,

  // ── Files and documents ────────────────────────────────────────────────
  // A tree says folder-or-file with its glyph, so the two must read apart at
  // 12px. Phosphor's folder and page are both solid silhouettes at `fill`,
  // which is what the row's ink ladder needs to move them.
  FolderIcon,
  FileIcon,

  // ── Reading ────────────────────────────────────────────────────────────
  ReadTimeIcon,
  DateIcon,

  // ── What a piece carries ───────────────────────────────────────────────
  // ArticleCard's "In this piece" chips take their glyph from the asset's
  // kind. `live` and `download` reuse DotIcon and DownloadIcon above — a
  // running tool is a state, and a download is a download — so only the two
  // kinds with nothing to borrow are named here.
  DatasetIcon,
  InteractiveIcon,

  // Canvas controls. A pannable, zoomable map needs zoom, fit and a sound
  // toggle, and every one of those is a lamp — so every one has to be a filled
  // glyph. The outline equivalents render as an empty disc inside IconButton,
  // which is what sent the first consumer back to hand-writing its own button.
  ZoomInIcon,
  ZoomOutIcon,
  // Fit-to-bounds, not recentre: the control frames the whole scene. Crosshair
  // reads as "aim at a point", which is a different promise.
  FitIcon,
  SoundOnIcon,
  SoundOffIcon,
  // Reset, which is not Fit. `fit` frames whatever is there now; `reset` puts
  // the scene back where it started, including whatever the reader turned off.
  // A canvas usually offers both, and a consumer with only `fit` reached past
  // the set for the second one.
  // Two arrows chasing each other, not one arrow going back. A single
  // counter-clockwise arrow reads as UNDO — a step reversed — where this is
  // "put it back the way it was", which is a different act.
  ResetIcon,

  // ── Window actions ─────────────────────────────────────────────────────
  // For a control that goes fullscreen without the traffic lights — a chart
  // that expands, a canvas with an expand button in its corner. `WindowControls`
  // draws the macOS discs and their marks itself; these are the plain buttons.
  //
  // Both are solid arrow clusters at `fill` rather than stroke-only glyphs, so
  // they take the lamp's glow. Phosphor's `Minus` would not: at `fill` it is a
  // square PLATE with the bar knocked out, which is the trap the Actions block
  // above names.
  MaximizeIcon,
  MinimizeIcon,
} from "./fluent-icons";

/**
 * The weight every icon that acts as a lamp must use.
 *
 * Exported as a constant rather than typed at each call site so the rule is
 * enforceable — `tooling/tests` asserts that lamp icons carry it.
 */
export const LAMP_WEIGHT = "fill" as const;
