"use client";

import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes } from "react";
import { cx } from "./utils";
import { CloseIcon, LAMP_WEIGHT, WindowMinimiseIcon, WindowZoomIcon } from "./icons";
import "./window-controls.css";

/**
 * How large the discs are drawn.
 *
 * `md` is macOS's own 12px, for a window chrome the reader is meant to reach
 * for. `sm` is 10px, for a specimen or a card-sized frame where a full-size
 * cluster out-shouts the title beside it.
 */
export type WindowControlsSize = "sm" | "md";

/** The accessible names, so the cluster can speak a language other than English. */
export interface WindowControlsLabels {
  close: string;
  minimise: string;
  maximise: string;
}

export interface WindowControlsProps extends Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> {
  onClose?: () => void;
  onMinimise?: () => void;
  onMaximise?: () => void;
  /**
   * Whether the window this belongs to has focus. `true` by default.
   *
   * An unfocused window's discs go grey — the same three shapes in the same
   * three places, drained of colour. That is the platform's own behaviour and
   * it is also the honest one: the actions have not gone away, the window has
   * merely stopped being the one you are working in.
   */
  focused?: boolean;
  size?: WindowControlsSize;
  labels?: WindowControlsLabels;
  /** Names the cluster for a screen reader landing on it as a group. */
  label?: string;
}

const DEFAULT_LABELS: WindowControlsLabels = { close: "Close", minimise: "Minimise", maximise: "Maximise" };

interface DotProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  kind: "close" | "minimise" | "maximise";
}

function Dot({ kind, ...props }: DotProps) {
  const Glyph = kind === "close" ? CloseIcon : kind === "minimise" ? WindowMinimiseIcon : WindowZoomIcon;
  return (
    <button
      {...props}
      type="button"
      className={cx("td-react-windowcontrols-dot", `td-react-windowcontrols-dot--${kind}`)}
    >
      <span className="td-react-windowcontrols-mark" aria-hidden="true">
        <Glyph weight={LAMP_WEIGHT} />
      </span>
    </button>
  );
}

/**
 * The three window actions, as the traffic lights: close, minimise, maximise,
 * left to right.
 *
 * There was no component for this, so every consumer drew its own — its own
 * maximise glyph, reached for from whatever icon set was to hand, and its own
 * three colours picked off a screenshot. Three hardcoded hex values in a
 * consumer's stylesheet are three values that will not follow the system
 * anywhere, and a maximise mark drawn from an outline set renders as an empty
 * disc inside this library's round buttons ([[L15]]).
 *
 * **The colours are literals on purpose, and they are the only ones in the
 * library that are.** `#FF5F57` / `#FEBC2E` / `#28C840` are the platform's,
 * the way WhatsApp's green is WhatsApp's — an identity the system reports
 * rather than a colour it chooses, so they must not move when the brand does.
 * `Terminal` draws the same three as decoration in its head; this is the
 * interactive one, and a cluster that DOES something is a row of buttons.
 *
 * **Omitting a handler disables that disc, it does not remove it.** The three
 * lights are a shape people recognise by its silhouette, and a cluster that is
 * sometimes two wide and sometimes three reflows the title beside it. A window
 * that cannot be minimised shows a minimise disc that cannot be pressed, which
 * is what every platform does.
 *
 * The marks appear on hover of the CLUSTER, not of the disc under the pointer
 * — reaching for one light lights all three, so the reader can see what they
 * are aiming at before they commit. Each disc is a real `<button>` with a real
 * accessible name, so the colour is never the only thing carrying which is
 * which; under `forced-colors` the marks are drawn permanently, because there
 * the fills are the system's and no longer tell the three apart.
 */
export const WindowControls = forwardRef<HTMLDivElement, WindowControlsProps>(function WindowControls(
  { onClose, onMinimise, onMaximise, focused = true, size = "md", labels = DEFAULT_LABELS, label = "Window controls", className, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      role="group"
      aria-label={label}
      data-focused={focused ? "true" : "false"}
      className={cx("td-react-windowcontrols", `td-react-windowcontrols--${size}`, className)}
    >
      <Dot kind="close" aria-label={labels.close} onClick={onClose} disabled={!onClose} />
      <Dot kind="minimise" aria-label={labels.minimise} onClick={onMinimise} disabled={!onMinimise} />
      <Dot kind="maximise" aria-label={labels.maximise} onClick={onMaximise} disabled={!onMaximise} />
    </div>
  );
});
