"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type HTMLAttributes, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import "./tonaldepth-canvas.css";
import { TonalDepthIconButton } from "./tonaldepth-icon-button";
import { TonalDepthBadge } from "./tonaldepth-badge";
import { TonalDepthFrame } from "./tonaldepth-frame";

const LAMP_WEIGHT = "fill" as const;

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/**
 * Microsoft's Fluent System Icons, filled weight, copied in because a registry
 * item is one self-contained file. Vendored from `@fluentui/svg-icons` and
 * stripped to `currentColor`, so the component's lamp ladder moves them.
 */
interface FluentIconProps extends SVGProps<SVGSVGElement> {
  /** Edge length. `1em` so the glyph scales with the type it sits beside. */
  size?: number | string;
  /** The fill. `currentColor` so the lamp ramp can move it. */
  color?: string;
  /**
   * Swallowed, not forwarded. Fluent marks are filled by construction, so
   * there is nothing to switch — but call sites pass `weight={LAMP_WEIGHT}`
   * and `weight` is not an SVG attribute, so React would put it on the DOM.
   */
  weight?: string;
  /** Flip horizontally, for a mark that points. */
  mirrored?: boolean;
}

interface FluentGlyphProps extends FluentIconProps {
  viewBox: string;
  d: string;
}

function FluentGlyph({ viewBox, d, size = "1em", color = "currentColor", weight, mirrored, ...props }: FluentGlyphProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={size}
      height={size}
      fill={color}
      transform={mirrored ? "scale(-1, 1)" : undefined}
      {...props}
    >
      <path d={d} />
    </svg>
  );
}

/** `full_screen_maximize_24_filled` */
function FitIcon(props: FluentIconProps) {
  return <FluentGlyph viewBox="0 0 24 24" d="M5 6a1 1 0 0 1 1-1h2a1 1 0 0 0 0-2H6a3 3 0 0 0-3 3v2a1 1 0 0 0 2 0zm0 12a1 1 0 0 0 1 1h2a1 1 0 1 1 0 2H6a3 3 0 0 1-3-3v-2a1 1 0 1 1 2 0zM18 5a1 1 0 0 1 1 1v2a1 1 0 1 0 2 0V6a3 3 0 0 0-3-3h-2a1 1 0 1 0 0 2zm1 13a1 1 0 0 1-1 1h-2a1 1 0 1 0 0 2h2a3 3 0 0 0 3-3v-2a1 1 0 1 0-2 0z" {...props} />;
}

/** `arrow_maximize_24_filled` */
function MaximizeIcon(props: FluentIconProps) {
  return <FluentGlyph viewBox="0 0 24 24" d="M19.5 3.5a1 1 0 0 1 1 1V12a1 1 0 1 1-2 0V6.91L6.91 18.5H12a1 1 0 1 1 0 2H4.5a1 1 0 0 1-1-1V12a1 1 0 1 1 2 0v5.09L17.09 5.5H12a1 1 0 1 1 0-2z" {...props} />;
}

/** `arrow_minimize_24_filled` */
function MinimizeIcon(props: FluentIconProps) {
  return <FluentGlyph viewBox="0 0 24 24" d="M10.5 12.5a1 1 0 0 1 1 .89V21a1 1 0 0 1-2 .12V15.9l-5.8 5.8a1 1 0 0 1-1.31.08l-.1-.08a1 1 0 0 1-.08-1.32l.08-.1 5.79-5.78H3a1 1 0 0 1-.12-2h7.62m3-10.5a1 1 0 0 1 1 .88V8.1l5.8-5.8a1 1 0 0 1 1.31-.08l.1.08a1 1 0 0 1 .08 1.32l-.08.1-5.8 5.8H21a1 1 0 0 1 .12 1.99H13.5a1 1 0 0 1-1-.88V3a1 1 0 0 1 1-1" {...props} />;
}

/** `arrow_sync_24_filled` */
function ResetIcon(props: FluentIconProps) {
  return <FluentGlyph viewBox="0 0 24 24" d="M16.05 5.03a1 1 0 0 0 .2 1.4 6.99 6.99 0 0 1-3.17 12.49l.71-.71a1 1 0 0 0-1.41-1.42l-2.5 2.5a1 1 0 0 0 0 1.42l2.5 2.5a1 1 0 0 0 1.41-1.42l-.84-.84a9 9 0 0 0 4.5-16.11 1 1 0 0 0-1.4.19m-1.93-1.74L11.62.8a1 1 0 0 0-1.5 1.32l.09.1.84.84a9 9 0 0 0-4.78 15.9 1 1 0 0 0 1.28-1.55 6.98 6.98 0 0 1 3.37-12.32l-.71.71a1 1 0 0 0 1.32 1.5l.1-.08 2.5-2.5a1 1 0 0 0 .07-1.32z" {...props} />;
}

/** `speaker_off_24_filled` */
function SoundOffIcon(props: FluentIconProps) {
  return <FluentGlyph viewBox="0 0 24 24" d="M3.28 2.22a.75.75 0 1 0-1.06 1.06L6.44 7.5H4.25C3.01 7.5 2 8.5 2 9.75v4.5c0 1.24 1 2.25 2.25 2.25h3.68q.28 0 .5.19l4.49 3.99c.8.72 2.08.14 2.08-.93v-3.69l5.72 5.72a.75.75 0 0 0 1.06-1.06zm13.86 11.74 1.14 1.14a7 7 0 0 0-.12-6.43.75.75 0 0 0-1.32.72 5.5 5.5 0 0 1 .3 4.57m2.25 2.25 1.1 1.09a10 10 0 0 0-.45-11.25.75.75 0 0 0-1.2.9 8.5 8.5 0 0 1 .55 9.26M9.52 6.34 15 11.82V4.25a1.25 1.25 0 0 0-2.08-.93z" {...props} />;
}

/** `speaker_2_24_filled` */
function SoundOnIcon(props: FluentIconProps) {
  return <FluentGlyph viewBox="0 0 24 24" d="M15 4.25v15.5a1.25 1.25 0 0 1-2.08.93l-4.5-4a.8.8 0 0 0-.49-.18H4.25C3.01 16.5 2 15.49 2 14.25v-4.5C2 8.5 3 7.5 4.25 7.5h3.68q.28 0 .5-.19l4.49-4c.8-.71 2.08-.14 2.08.94m4 1.65a.75.75 0 0 1 1.04.15 10 10 0 0 1 0 11.9.75.75 0 0 1-1.2-.9 8.5 8.5 0 0 0 0-10.1.75.75 0 0 1 .15-1.05m-1.86 2.47a.75.75 0 0 1 1.02.3 7 7 0 0 1 0 6.66.75.75 0 0 1-1.32-.72 5.5 5.5 0 0 0 0-5.22.75.75 0 0 1 .3-1.02" {...props} />;
}

/** `zoom_in_24_filled` */
function ZoomInIcon(props: FluentIconProps) {
  return <FluentGlyph viewBox="0 0 24 24" d="M10 2a8 8 0 0 1 6.16 13.1l4.62 4.62a.75.75 0 0 1-1.06 1.06l-4.62-4.62A8 8 0 1 1 10 2m0 4.5a.75.75 0 0 0-.75.75v2h-2a.75.75 0 0 0 0 1.5h2v2a.75.75 0 0 0 1.5 0v-2h2a.75.75 0 0 0 0-1.5h-2v-2A.75.75 0 0 0 10 6.5" {...props} />;
}

/** `zoom_out_24_filled` */
function ZoomOutIcon(props: FluentIconProps) {
  return <FluentGlyph viewBox="0 0 24 24" d="M10 2a8 8 0 0 1 6.16 13.1l4.62 4.62a.75.75 0 0 1-1.06 1.06l-4.62-4.62A8 8 0 1 1 10 2M7.25 9.25a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5z" {...props} />;
}

/** A rectangle in world space — the coordinates the children are laid out in. */
export interface TonalDepthCanvasBox { x: number; y: number; w: number; h: number }

/** Where the camera is: the world's offset on screen, and its scale. */
export interface TonalDepthCanvasTransform { x: number; y: number; scale: number }

export interface TonalDepthCanvasFlyOptions {
  /** Skip the flight. Forced under `prefers-reduced-motion`. */
  immediate?: boolean;
  /** Space left around the box, in screen pixels. */
  padding?: number;
  /** Extra space on the right — the room a `CanvasPanel` is covering. */
  padRight?: number;
  /** A ceiling for this flight only, so framing one small node does not fill
   *  the screen with it. */
  max?: number;
}

/**
 * The camera, handed to the caller through the ref.
 *
 * **The ref is the camera, not the element.** A canvas is driven — a click on a
 * node flies to it, a breadcrumb flies back out — and a caller holding the
 * `<section>` can do none of that. The DOM node is reachable through the
 * `world` and `viewport` fields for the rare case that needs it.
 */
export interface TonalDepthCanvasApi {
  /** TonalDepthFrame a world-space box. */
  flyTo: (box: TonalDepthCanvasBox, options?: TonalDepthCanvasFlyOptions) => void;
  /** TonalDepthFrame the whole `world` box — what the fit control does. */
  fit: (options?: TonalDepthCanvasFlyOptions) => void;
  zoomBy: (factor: number) => void;
  panBy: (dx: number, dy: number) => void;
  getTransform: () => TonalDepthCanvasTransform;
  getViewport: () => { w: number; h: number };
}

/**
 * What a naked wheel does.
 *
 * `modifier` is the default and the one an embedded map wants: the page
 * scrolls as it always did, and only ⌘/Ctrl+wheel — which is also what a
 * trackpad pinch sends — zooms. A canvas that eats the scroll wheel is a
 * canvas the reader cannot scroll past, and they meet it before they have
 * decided they want to use it.
 *
 * `free` is for a canvas that has taken over the display, where there is no
 * page behind it to scroll. `off` leaves the wheel alone entirely.
 */
export type TonalDepthCanvasWheelMode = "modifier" | "free" | "off";

export interface TonalDepthCanvasSoundControl {
  muted: boolean;
  onToggle: () => void;
}

export interface TonalDepthCanvasControlsProps extends Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> {
  /** The camera these drive. The same ref the `TonalDepthCanvas` was given. */
  camera: { current: TonalDepthCanvasApi | null };
  /** How far one press moves. 1.3 in, its reciprocal out. */
  step?: number;
  /** Draw the fit control. Omit for a canvas with no whole view to return to. */
  fit?: boolean;
  /**
   * What the fit control does, when putting the map back means more than
   * moving the camera.
   *
   * A reader who is lost does not distinguish between "I have zoomed too far"
   * and "I have turned things off and moved them around" — both are answered
   * by one control that puts the map back as it ships. Given this, the button
   * calls it instead of `camera.fit()`, and says so in its name.
   */
  onReset?: () => void;
  /**
   * The way in and out of the display, when the canvas offers one.
   *
   * Leaving especially: in fullscreen the host's own chrome is off screen and
   * Escape is not a visible affordance, so without a control here there is no
   * way back that anyone can see.
   */
  fullscreen?: { active: boolean; onToggle: () => void };
  /** Interface sound, when the canvas makes any. Omitted draws no mute button. */
  sound?: TonalDepthCanvasSoundControl;
  /** `column` floats over the canvas; `row` is for a host laying them out in
   *  its own chrome — a TonalDepthFrame's head, a toolbar. */
  direction?: "row" | "column";
  labels?: Partial<Record<"zoomIn" | "zoomOut" | "fit" | "reset" | "mute" | "unmute" | "enterFullscreen" | "leaveFullscreen", string>>;
  /** Appended after the cluster — a theme switch, a fullscreen action. */
  children?: ReactNode;
}

const TonalDepthCONTROL_LABELS = {
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  /* Fit AND undo, in one control. The reader who is lost does not distinguish
     between "I have zoomed too far" and "I have opened the wrong thing"; both
     are answered by putting the whole map back. */
  fit: "Fit the whole map on screen",
  reset: "Reset the map: fit it on screen and undo your changes",
  mute: "Mute interface sounds",
  unmute: "Unmute interface sounds",
  enterFullscreen: "Go fullscreen",
  leaveFullscreen: "Leave fullscreen",
};

/**
 * The map's own controls: zoom in, zoom out, fit, and mute.
 *
 * Exported separately from `TonalDepthCanvas` because a host that draws its own chrome
 * needs the SAME four buttons in its head rather than a second set assembled
 * beside them — which is exactly what the first consumer built, twice, out of
 * hand-written `td-iconbtn` markup and an outline icon set.
 *
 * Every button is an `TonalDepthIconButton` carrying a filled glyph from the library's
 * own set, so each one is a lamp ([[L15]]) and none of them is a bare
 * `<button>` with somebody else's mark inside it.
 */
export const TonalDepthCanvasControls = forwardRef<HTMLDivElement, TonalDepthCanvasControlsProps>(function TonalDepthCanvasControls(
  { camera, step = 1.3, fit = true, onReset, sound, fullscreen, direction = "column", labels, className, children, ...props },
  ref,
) {
  const name = { ...TonalDepthCONTROL_LABELS, ...labels };
  return (
    <div
      {...props}
      ref={ref}
      className={cx("td-registry-canvas-controls", `td-registry-canvas-controls--${direction}`, className)}
    >
      <TonalDepthIconButton
        icon={<ZoomInIcon weight={LAMP_WEIGHT} />}
        aria-label={name.zoomIn}
        onClick={() => camera.current?.zoomBy(step)}
      />
      <TonalDepthIconButton
        icon={<ZoomOutIcon weight={LAMP_WEIGHT} />}
        aria-label={name.zoomOut}
        onClick={() => camera.current?.zoomBy(1 / step)}
      />
      {fit ? (
        <TonalDepthIconButton
          icon={onReset ? <ResetIcon weight={LAMP_WEIGHT} /> : <FitIcon weight={LAMP_WEIGHT} />}
          aria-label={onReset ? name.reset : name.fit}
          onClick={() => (onReset ? onReset() : camera.current?.fit())}
        />
      ) : null}
      {sound ? (
        <TonalDepthIconButton
          icon={sound.muted ? <SoundOffIcon weight={LAMP_WEIGHT} /> : <SoundOnIcon weight={LAMP_WEIGHT} />}
          aria-label={sound.muted ? name.unmute : name.mute}
          aria-pressed={sound.muted}
          onClick={sound.onToggle}
        />
      ) : null}
      {fullscreen ? (
        /* Lit a different colour from the four above it, because it does a
           different kind of thing: those drive the camera, this one changes
           what the map is IN. Sharing their lamp made "leave fullscreen" read
           as one more zoom control, and it is the one control a reader who has
           taken the display needs to find at a glance. Colour is carried by
           the lamp ([[L15]]) rather than a fill, so the housing is still the
           same carved surface as its neighbours ([[L11]]). */
        <TonalDepthIconButton
          className="td-registry-canvas-display"
          glow="var(--td-accent)"
          icon={fullscreen.active ? <MinimizeIcon weight={LAMP_WEIGHT} /> : <MaximizeIcon weight={LAMP_WEIGHT} />}
          aria-label={fullscreen.active ? name.leaveFullscreen : name.enterFullscreen}
          aria-pressed={fullscreen.active}
          onClick={fullscreen.onToggle}
        />
      ) : null}
      {children}
    </div>
  );
});

/* `title` is a ReactNode here, so the DOM attribute of the same name — which
   is a tooltip string — is dropped rather than fought with. TonalDepthFrame does the
   same, for the same reason. */
export interface TonalDepthCanvasProps extends Omit<HTMLAttributes<HTMLElement>, "onSelect" | "title"> {
  /** Names the canvas. It is an `application` to a screen reader and has no
   *  other name — set it. */
  label: string;
  /** The world-space bounds `fit` frames. Without it, fit does nothing. */
  world?: TonalDepthCanvasBox;
  /** Scale floor and ceiling. */
  min?: number;
  max?: number;
  /** Where the camera starts, when there is no `world` to fit. */
  initialScale?: number;
  wheel?: TonalDepthCanvasWheelMode;
  /** Off renders the plane with no camera at all — the phone layout, where a
   *  scene is read rather than driven. */
  interactive?: boolean;
  /** Space `fit` leaves around the world, in screen pixels. */
  padding?: number;
  /**
   * Room `fit` leaves on the right for a `CanvasPanel` covering the canvas.
   *
   * It applies to flights fired after the panel is open. A flight fired from
   * the SAME handler that opens it should pass `padRight` itself — props are a
   * render behind, so this is still the closed value at that moment.
   */
  panelInset?: number;
  /** Draw the built-in control cluster. Turn it off when the host draws
   *  `TonalDepthCanvasControls` in its own chrome. */
  controls?: boolean;
  sound?: TonalDepthCanvasSoundControl;
  /** Handed to the built-in cluster — see `TonalDepthCanvasControlsProps`. */
  onReset?: () => void;
  fullscreenControl?: { active: boolean; onToggle: () => void };
  /** The one-line gesture teach. It retires itself on the first gesture. */
  hint?: ReactNode;
  /** Top-left slot: where the reader is. */
  breadcrumb?: ReactNode;
  /** Top-right slot: a persistent control — an industry switcher, a legend. */
  switcher?: ReactNode;
  /** A bar along the bottom. Given one, the control cluster joins it rather
   *  than floating in the opposite corner. */
  tools?: ReactNode;
  /** Bottom-centre slot, for the one action the canvas is selling. */
  cta?: ReactNode;
  /**
   * The reading panel — a `CanvasPanel` — pinned to the canvas box.
   *
   * A slot rather than a child, because `children` are laid out in WORLD space
   * and travel with the camera: a panel among them would pan off the screen
   * and shrink as the reader zoomed out. This renders it as a sibling of the
   * plane, so it holds its corner while the map moves under it.
   */
  panel?: ReactNode;
  /** Escape, once the canvas has focus — usually "go up a level". */
  onEscape?: () => void;
  /** Fired when a wheel or pinch settles, for semantic snapping. */
  onZoomSettled?: (scale: number) => void;
  /**
   * Housing. Given a `title` (or an `eyebrow`, `description` or `footnote`)
   * the canvas draws its own `TonalDepthFrame` around itself and moves the control
   * cluster into that TonalDepthframe's head — which is where a housed map's controls
   * belong, and stops them floating over the map's own data.
   *
   * Without any of them the canvas is the plate itself: a raised card with the
   * controls floating over the plane.
   */
  title?: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  footnote?: ReactNode;
  /** Extra controls in the TonalDepthframe's head, beside the cluster. */
  actions?: ReactNode;
  /**
   * The ground the map sits on. Any CSS background — a colour, a gradient, an
   * image, a grid.
   *
   * The default is the page's own `--td-bg`, so a canvas follows the theme.
   * Reach for this when the map needs a ground of its own — a blueprint grid,
   * a satellite tile — and remember that a value stated here is stated for
   * BOTH themes unless it is a token.
   */
  background?: string;
  /**
   * Let the canvas take the display, and draw the control for it.
   *
   * The canvas owns the state: the control toggles it, Escape leaves it, the
   * page behind is locked while it is on. Use `fullscreen` instead to drive it
   * from outside.
   */
  allowFullscreen?: boolean;
  /**
   * The canvas has taken the display, driven from outside. It covers the
   * viewport and locks the page behind it; overlays opened from inside still
   * portal to the body and stack above.
   */
  fullscreen?: boolean;
  /**
   * `card` is the default raised plate. `bare` paints nothing — for a canvas
   * inside a `TonalDepthFrame`, whose carved well is the housing already, and for a
   * full-bleed canvas page.
   */
  surface?: "card" | "bare";
  children: ReactNode;
}

const TonalDepthEASE_IN_OUT = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

const TonalDepthFLIGHT_MS = 850;

/** How far a box has to be from the viewport's centre before the camera flies. */
function TonalDepthframe(box: TonalDepthCanvasBox, viewport: { w: number; h: number }, options: TonalDepthCanvasFlyOptions, min: number, max: number): TonalDepthCanvasTransform {
  const pad = options.padding ?? 48;
  const padRight = options.padRight ?? 0;
  const scale = Math.max(min, Math.min(
    (viewport.w - pad * 2 - padRight) / box.w,
    (viewport.h - pad * 2) / box.h,
    options.max ?? max,
  ));
  return {
    x: (viewport.w - padRight) / 2 - (box.x + box.w / 2) * scale,
    y: viewport.h / 2 - (box.y + box.h / 2) * scale,
    scale,
  };
}

/**
 * A pannable, zoomable plane and the chrome around it.
 *
 * This is the housing for a map the reader drives: an estate diagram, a
 * systems interconnect, an isometric scene. Drag pans, wheel or pinch zooms
 * about the pointer, double-click dives, the arrow keys pan and `+`/`-` zoom.
 * The camera is handed back through the ref so the page can fly to a node when
 * one is opened and fly back out when it is closed.
 *
 * **One transform, no raster.** The whole world is a single `translate` +
 * `scale` on one element, so every child stays an ordinary DOM node: text is
 * selectable, links are focusable, and nothing is redrawn to a bitmap at a
 * zoom level. It also means the children are laid out in world coordinates of
 * your choosing — the canvas never asks what they mean.
 *
 * **A drag is not a click.** Pointer travel past a few pixels, and any click
 * landing within a quarter-second of a gesture, is swallowed before it reaches
 * whatever was under the pointer. Without that, panning across a map opens
 * whichever node the pointer happened to be over when it stopped — which is
 * the single most common way a hand-built canvas is wrong.
 *
 * **The wheel is polite by default.** An embedded canvas leaves a naked wheel
 * to the page and zooms only on ⌘/Ctrl+wheel or a trackpad pinch; see
 * `TonalDepthCanvasWheelMode`. A canvas that has taken the display should pass
 * `wheel="free"`.
 *
 * The plane publishes `--td-canvas-scale`, and a ready-made
 * `--td-canvas-label-k` inverse of it, so a label can hold its size on screen
 * while the object it belongs to scales with the world.
 */
export const TonalDepthCanvas = forwardRef<TonalDepthCanvasApi, TonalDepthCanvasProps>(function TonalDepthCanvas(
  {
    label, world, min = 0.12, max = 3, initialScale = 1, wheel = "modifier", interactive = true,
    padding = 48, panelInset = 0, controls = true, sound, onReset, fullscreenControl, hint, breadcrumb, switcher, tools, cta,
    onEscape, onZoomSettled, fullscreen, allowFullscreen = false, surface = "card", panel,
    title, eyebrow, description, footnote, actions, background, className, children, ...props
  },
  ref,
) {
  const viewportRef = useRef<HTMLDivElement>(null);
  /* The viewport is tracked as STATE as well as a ref because the fullscreen
     canvas is portalled, and a portal move tears the DOM down and builds it
     again. Effects that captured the old node would go on listening to a
     detached element — the wheel would stop zooming the moment the reader
     went fullscreen. The ref stays for the handlers, which read it when they
     fire; the state is what the effects depend on. */
  const [viewportNode, setViewportNode] = useState<HTMLDivElement | null>(null);
  /** Set when the canvas takes or gives back the display: the next resize
   *  refits even though the reader has driven the camera. */
  const refitOnResize = useRef(false);
  const attachViewport = useCallback((node: HTMLDivElement | null) => {
    viewportRef.current = node;
    setViewportNode(node);
  }, []);
  const worldRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<TonalDepthCanvasApi | null>(null);
  const transform = useRef<TonalDepthCanvasTransform>({ x: 0, y: 0, scale: initialScale });
  const flight = useRef<number | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef(0);
  const dragged = useRef(false);
  /** Cumulative travel this gesture — the accidental-click guard. */
  const travel = useRef(0);
  const lastGesture = useRef(0);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** True until something moves the camera off its opening fit. */
  const pristine = useRef(true);
  const [gestured, setGestured] = useState(false);
  /* Uncontrolled unless the caller passes `fullscreen`. A control that does
     nothing until the page wires it up is a control that ships broken, so the
     canvas keeps the state itself and `fullscreen` overrides it. */
  const [ownFullscreen, setOwnFullscreen] = useState(false);
  const isFullscreen = fullscreen ?? ownFullscreen;

  /* Read through refs so the wheel listener — which must be non-passive, and so
     cannot be a React prop — never needs rebinding when a handler identity
     changes. */
  const wheelRef = useRef(wheel);
  wheelRef.current = wheel;
  const settledRef = useRef(onZoomSettled);
  settledRef.current = onZoomSettled;

  const apply = useCallback(() => {
    const el = worldRef.current;
    if (!el) return;
    const { x, y, scale } = transform.current;
    el.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    el.style.setProperty("--td-canvas-scale", String(scale));
  }, []);

  const stop = useCallback(() => {
    if (flight.current !== null) cancelAnimationFrame(flight.current);
    flight.current = null;
  }, []);

  const clamp = useCallback((scale: number) => Math.min(max, Math.max(min, scale)), [min, max]);

  /** Zoom about a point in viewport coordinates, so the thing under the
   *  pointer stays under the pointer. */
  const zoomAbout = useCallback((cx: number, cy: number, factor: number) => {
    const next = clamp(transform.current.scale * factor);
    const k = next / transform.current.scale;
    transform.current.x = cx - (cx - transform.current.x) * k;
    transform.current.y = cy - (cy - transform.current.y) * k;
    transform.current.scale = next;
    pristine.current = false;
    apply();
  }, [apply, clamp]);

  const scheduleSettle = useCallback(() => {
    if (!settledRef.current) return;
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(() => settledRef.current?.(transform.current.scale), 220);
  }, []);

  const flyTo = useCallback((box: TonalDepthCanvasBox, options: TonalDepthCanvasFlyOptions = {}) => {
    const vp = viewportRef.current;
    if (!vp) return;
    stop();
    pristine.current = false;
    const size = { w: vp.clientWidth, h: vp.clientHeight };
    const target = TonalDepthframe(box, size, { padding, padRight: panelInset, ...options }, min, max);
    /* Feature-detected, not assumed: `matchMedia` is missing from jsdom and
       from any renderer that is not a browser, and an unguarded call throws
       on the first flight rather than degrading. No query means no stated
       preference, which is the same answer as "no". */
    const reduced = typeof window !== "undefined" && typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (options.immediate || reduced) {
      Object.assign(transform.current, target);
      apply();
      return;
    }
    const from = { ...transform.current };
    const started = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - started) / TonalDepthFLIGHT_MS);
      const e = TonalDepthEASE_IN_OUT(t);
      transform.current.x = from.x + (target.x - from.x) * e;
      transform.current.y = from.y + (target.y - from.y) * e;
      transform.current.scale = from.scale + (target.scale - from.scale) * e;
      apply();
      flight.current = t < 1 ? requestAnimationFrame(step) : null;
    };
    flight.current = requestAnimationFrame(step);
  }, [apply, stop, padding, panelInset, min, max]);

  /* Built here rather than inside `useImperativeHandle`, and this is not a
     style choice: React does not call that hook's factory at all when the ref
     is null, so a caller who wanted no camera of their own left the canvas
     without one — the keyboard did nothing and the canvas's own zoom buttons
     were dead. The controls and the keys read this; the hook only publishes
     it. */
  const camera = useMemo<TonalDepthCanvasApi>(() => {
    const api: TonalDepthCanvasApi = {
      flyTo,
      fit: options => { if (world) flyTo(world, options); },
      zoomBy: factor => {
        const vp = viewportRef.current;
        if (!vp) return;
        stop();
        zoomAbout(vp.clientWidth / 2, vp.clientHeight / 2, factor);
        scheduleSettle();
      },
      panBy: (dx, dy) => { stop(); pristine.current = false; transform.current.x += dx; transform.current.y += dy; apply(); },
      getTransform: () => ({ ...transform.current }),
      getViewport: () => ({ w: viewportRef.current?.clientWidth ?? 0, h: viewportRef.current?.clientHeight ?? 0 }),
    };
    return api;
  }, [flyTo, world, stop, zoomAbout, scheduleSettle, apply]);
  cameraRef.current = camera;
  useImperativeHandle(ref, () => camera, [camera]);

  /* The first paint, and the opening fit. A canvas whose world is known should
     open framing it rather than at an arbitrary origin — otherwise every
     consumer writes the same mount effect. */
  const openingFit = useCallback(() => {
    if (!world) return;
    flyTo(world, { immediate: true });
    pristine.current = true;
  }, [flyTo, world]);

  /* A canvas can be laid out at no size at all — mounted inside a closed tab,
     an accordion, or anything else display:none — and the opening fit computed
     against a 0×0 viewport is meaningless. It also goes stale the moment the
     canvas is resized. So the fit is re-run whenever the box changes, for as
     long as nothing has moved the camera: once the reader (or the page) has
     driven it, a resize must not yank them back to the whole map. */
  useEffect(() => {
    const vp = viewportNode;
    if (!vp || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (!pristine.current && !refitOnResize.current) return;
      refitOnResize.current = false;
      openingFit();
    });
    observer.observe(vp);
    return () => observer.disconnect();
  }, [openingFit, viewportNode]);

  useEffect(() => {
    apply();
    openingFit();
    return () => { stop(); if (settle.current) clearTimeout(settle.current); };
    // Fitting again because a handler's identity changed would throw the
    // reader's own camera away mid-read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Taking the display, and giving it back, both refit — even when the reader
     has driven the camera. A plain resize deliberately does NOT (see the
     observer above), because dragging a window is not a request to go
     anywhere; but pressing fullscreen IS one. The screen has changed shape
     and the reader asked for it, so the map arrives framed to it rather than
     showing whichever corner they were last reading, blown up or stranded.

     The flag is all this does — the refit itself happens in the resize the
     display change causes, which is the one moment the new box has a size to
     measure against. `requestAnimationFrame` was tried for the timing and is
     wrong twice over: it does not run in a background tab, so a canvas
     toggled while the tab is hidden comes back framing the box it no longer
     has; and an effect that writes a "has it changed?" ref before scheduling
     one cannot survive being run twice, which is exactly what StrictMode
     does to it. Raising a flag survives it — running this twice sets the same
     flag — which is why the mount guard is safe HERE and was not there. The
     guard matters: without it the flag is up from the first render and the
     first resize refits a camera the reader had already driven. */
  const displayedAs = useRef(isFullscreen);
  useEffect(() => {
    if (displayedAs.current === isFullscreen) return;
    displayedAs.current = isFullscreen;
    refitOnResize.current = true;
  }, [isFullscreen]);

  /* The portal rebuilds the DOM, so the world element is a new one carrying no
     inline transform — the camera would sit at the identity until the reader
     next moved it. Writing it back on attach keeps the map where it was while
     the refit above is still a layout away. */
  useEffect(() => { if (viewportNode) apply(); }, [viewportNode, apply]);

  /* Wheel has to be a non-passive native listener: React's onWheel is passive,
     and a passive listener cannot preventDefault the page scroll. */
  useEffect(() => {
    const vp = viewportNode;
    if (!vp || !interactive) return;
    const onWheel = (event: WheelEvent) => {
      if (wheelRef.current === "off") return;
      // A trackpad pinch arrives as a wheel event with ctrlKey set — which is
      // why the modifier and the pinch are one branch rather than two.
      const zoomIntent = event.ctrlKey || event.metaKey;
      if (wheelRef.current === "modifier" && !zoomIntent) return;
      event.preventDefault();
      stop();
      const rect = vp.getBoundingClientRect();
      // Pinch deltas are an order of magnitude smaller than a wheel's.
      const intensity = event.ctrlKey ? 0.012 : 0.0016;
      zoomAbout(event.clientX - rect.left, event.clientY - rect.top, Math.exp(-event.deltaY * intensity));
      lastGesture.current = performance.now();
      setGestured(true);
      scheduleSettle();
    };
    vp.addEventListener("wheel", onWheel, { passive: false });
    return () => vp.removeEventListener("wheel", onWheel);
  }, [interactive, stop, zoomAbout, scheduleSettle, viewportNode]);

  const onPointerDown = (event: ReactPointerEvent) => {
    if (!interactive) return;
    (event.target as Element).setPointerCapture?.(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    dragged.current = false;
    travel.current = 0;
    setGestured(true);
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };

  const onPointerMove = (event: ReactPointerEvent) => {
    if (!interactive || !pointers.current.has(event.pointerId)) return;
    const previous = pointers.current.get(event.pointerId)!;
    const dx = event.clientX - previous.x;
    const dy = event.clientY - previous.y;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    travel.current += Math.abs(dx) + Math.abs(dy);

    if (pointers.current.size === 1) {
      // Two pixels of slop, so a shaky press is still a press.
      if (travel.current > 2) {
        dragged.current = true;
        /* Suppress selection for the duration of the drag, written straight to
           the node rather than through state: a pan must not re-render on
           every pointermove. Dragging across the plane otherwise sweeps a blue
           selection through every label it crosses — and turning selection off
           permanently would cost the thing that makes a DOM canvas worth
           having, which is that the text on it is real. */
        viewportRef.current?.setAttribute("data-panning", "true");
        stop();
        transform.current.x += dx;
        transform.current.y += dy;
        apply();
      }
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const rect = viewportRef.current!.getBoundingClientRect();
      if (pinch.current > 0) {
        dragged.current = true;
        stop();
        zoomAbout((a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top, distance / pinch.current);
      }
      pinch.current = distance;
      scheduleSettle();
    }
  };

  const onPointerUp = (event: ReactPointerEvent) => {
    pointers.current.delete(event.pointerId);
    pinch.current = 0;
    /* The gesture is recorded and then FORGOTTEN. Leaving `dragged` and
       `travel` set until the next pointerdown left them stale for anything
       that arrives without one — and a click IS one of those things when it
       comes from the keyboard, so activating a node with Enter after panning
       the map did nothing at all. The timestamp is the only state that
       outlives the gesture, and it expires on its own. */
    if (dragged.current) lastGesture.current = performance.now();
    dragged.current = false;
    travel.current = 0;
    viewportRef.current?.removeAttribute("data-panning");
  };

  /* A drag must not count as a click on whatever node is under the pointer at
     release. Swallowed in the CAPTURE phase, before the child sees it — and on
     the timestamp alone, so a keyboard activation minutes later is not still
     paying for a pan. */
  const onClickCapture = (event: React.MouseEvent) => {
    if (performance.now() - lastGesture.current < 250) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const onDoubleClick = (event: React.MouseEvent) => {
    if (!interactive || !viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    stop();
    zoomAbout(event.clientX - rect.left, event.clientY - rect.top, 1.7);
    scheduleSettle();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const api = cameraRef.current;
    if (!api || !interactive) return;
    const pan = 90;
    switch (event.key) {
      case "ArrowLeft": api.panBy(pan, 0); break;
      case "ArrowRight": api.panBy(-pan, 0); break;
      case "ArrowUp": api.panBy(0, pan); break;
      case "ArrowDown": api.panBy(0, -pan); break;
      case "+": case "=": api.zoomBy(1.25); break;
      case "-": case "_": api.zoomBy(0.8); break;
      /* Escape is the way out of the deepest thing first. Leaving fullscreen
         beats going up a level in the map — a reader who has taken over the
         display and presses Escape means the takeover. */
      case "Escape":
        if (allowFullscreen && fullscreen === undefined && ownFullscreen) setOwnFullscreen(false);
        else onEscape?.();
        break;
      default: return;
    }
    event.preventDefault();
  };

  /* A canvas given anything to say about itself draws its own housing. The
     TonalDepthframe's plate carries the identity and the well carries the map, which is
     the system's own separation ([[L32]]) — and it is the reason a housed
     canvas paints no plate of its own. */
  const housed = title !== undefined || eyebrow !== undefined || description !== undefined || footnote !== undefined;
  /* Where the controls go. Housed, they belong to the TonalDepthframe's head — but in
     fullscreen that head is not on screen, so a housed map would lose zoom,
     fit and mute at exactly the moment it has the most room to use them. The
     canvas draws them itself there. */
  const chromeInside = !housed || isFullscreen;

  const cluster = controls ? (
    <TonalDepthCanvasControls
      camera={cameraRef}
      fit={Boolean(world) || Boolean(onReset)}
      onReset={onReset}
      sound={sound}
      fullscreen={
        fullscreenControl
        ?? (allowFullscreen ? { active: isFullscreen, onToggle: () => setOwnFullscreen(open => !open) } : undefined)
      }
      direction={tools || !chromeInside ? "row" : "column"}
      className={tools || !chromeInside ? undefined : "td-registry-canvas-controls--floating"}
    />
  ) : null;

  /* The caller's own height is dropped for the takeover. Almost every canvas
     is given one — a fixed band in a page — and an inline height beats the
     `height: 100%` the fullscreen rule sets, so without this the "fullscreen"
     canvas covered the viewport's WIDTH and stayed 420px tall with the page
     showing under it. */
  const { height, minHeight, maxHeight, ...restStyle } = props.style ?? {};
  const canvasStyle = {
    ...(isFullscreen ? restStyle : props.style),
    ...(background ? { ["--td-canvas-ground" as string]: background } : null),
  };

  const canvas = (
    <section
      {...props}
      role="application"
      aria-label={label}
      tabIndex={0}
      data-fullscreen={isFullscreen || undefined}
      style={canvasStyle}
      className={cx(
        "td-registry-canvas",
        surface === "card" && !housed && !isFullscreen && "td-card-surface-static",
        // Housed, but standing on its own for the takeover — so it paints a
        // ground again rather than showing the page through itself.
        housed && isFullscreen && "td-registry-canvas--standalone",
        isFullscreen && "td-registry-canvas--fullscreen",
        className,
      )}
      onKeyDown={onKeyDown}
    >
      <div
        ref={attachViewport}
        className={cx("td-registry-canvas-viewport", interactive && "td-registry-canvas-viewport--interactive")}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
        onDoubleClick={onDoubleClick}
      >
        <div ref={worldRef} className="td-registry-canvas-world">{children}</div>
      </div>

      {panel}

      {breadcrumb ? <div className="td-registry-canvas-hud">{breadcrumb}</div> : null}
      {switcher ? <div className="td-registry-canvas-hud td-registry-canvas-hud--right">{switcher}</div> : null}

      {tools ? (
        <div className="td-registry-canvas-toolbar">
          {tools}
          {chromeInside ? cluster : null}
        </div>
      ) : chromeInside ? cluster : null}

      {cta ? <div className="td-registry-canvas-cta">{cta}</div> : null}
      {hint ? (
        /* Retired rather than removed: taking it out of the tree on the first
           gesture reflows the bottom of the canvas under the reader's hand. */
        <TonalDepthBadge
          aria-hidden={gestured}
          data-retired={gestured || undefined}
          className="td-registry-canvas-hint"
        >
          {hint}
        </TonalDepthBadge>
      ) : null}
    </section>
  );

  /* In fullscreen the canvas is the whole screen, so the TonalDepthframe around it has
     nothing left to house — and a plate rendered off screen would take the
     controls with it, which is exactly when the reader needs them most.

     It also leaves the page for `document.body`. `position: fixed` resolves
     against a transformed ancestor rather than the viewport, and a z-index is
     only ever compared inside its own stacking context — so a canvas whose
     host has a transform, a filter, or its own z-index covers that host and
     nothing more, and the page's header goes on painting over the "fullscreen"
     map. No z-index the canvas could name would win, because the comparison
     never reaches the header. Escaping the subtree is the only fix, and it is
     the same one NavDrawer and BottomNav make for the same reason. */
  if (isFullscreen) {
    return typeof document === "undefined" ? canvas : createPortal(canvas, document.body);
  }
  if (!housed) return canvas;
  return (
    <TonalDepthFrame
      eyebrow={eyebrow}
      title={title}
      description={description}
      footnote={footnote}
      actions={actions || cluster ? <div className="td-registry-canvas-head">{cluster}{actions}</div> : undefined}
      flushContent
    >
      {canvas}
    </TonalDepthFrame>
  );
});
