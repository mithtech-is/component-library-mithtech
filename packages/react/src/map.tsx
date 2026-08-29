import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";
import "./map.css";

/** Which category a pin belongs to. Colour is category, never emphasis. */
export type MapPinTone = "neutral" | "brand" | "accent" | "green" | "error";

export interface MapPin {
  /** Stable key. */
  id: string;
  label: ReactNode;
  /** Position across the map, 0–100, measured from its left edge. */
  x: number;
  /** Position down the map, 0–100, measured from its top edge. */
  y: number;
  tone?: MapPinTone;
  /** Read after the label where the label alone does not say enough. */
  description?: string;
}

export interface MapProps extends HTMLAttributes<HTMLDivElement> {
  pins: MapPin[];
  /** Names the map. It has no other accessible name — set it. */
  label: string;
  /** The ground: your own outline, as inline SVG or an image. */
  children?: ReactNode;
  /** The graticule under the ground. */
  grid?: boolean;
  /** Width over height. Default 16 / 9. */
  ratio?: number;
  /** Show each pin's label beside its lamp. Off leaves the labels for screen readers only. */
  showLabels?: boolean;
}

/**
 * A static locator map.
 *
 * **There is no tile provider and no network call, by design.** It draws a
 * carved ground, an optional graticule, and pins at coordinates you give it as
 * percentages. Reaching a tile server would put a third party in the render
 * path of every page that shows an office address, and it would need a key, a
 * consent banner and an attribution line for a picture that never changes.
 * Pass your own outline as `children` — an inline SVG, a static image — and the
 * component positions the pins over it.
 *
 * **It does not project coordinates.** `x` and `y` are percentages of the box,
 * not latitude and longitude: the outline is yours, so only you know what
 * projection it is in. Converting lat/long here would mean guessing.
 *
 * The design system's own map fills its ground with an accent-to-brand
 * gradient. Filling with the brand colour is the one move the system forbids
 * ([[L11]]) and a tinted plane is not a boundary ([[L03]]), so the ground here
 * is the plain surface pressed in — a map is a measured object and data is
 * recessed ([[L32]]). Each pin is a lamp in a socket ([[L25]]): the socket is
 * the map's own material, and colour exists only where the light is.
 */
export const Map = forwardRef<HTMLDivElement, MapProps>(function Map(
  { pins, label, children, grid = true, ratio = 16 / 9, showLabels = true, className, style, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      role="group"
      aria-label={label}
      style={{ ...style, aspectRatio: `${ratio}` }}
      className={cx("td-map", "td-react-map", className)}
    >
      {children ? <div className="td-react-map-ground" aria-hidden="true">{children}</div> : null}
      {grid ? <div className="td-map-grid td-react-map-grid" aria-hidden="true" /> : null}
      <ul className="td-react-map-pins">
        {pins.map(pin => (
          <li
            key={pin.id}
            className={cx("td-map-pin", "td-react-map-pin")}
            data-tone={pin.tone ?? "brand"}
            style={{ left: `${pin.x}%`, top: `${pin.y}%` } as CSSProperties}
          >
            <span className="td-map-pin-dot td-react-map-pin-dot" aria-hidden="true" />
            <span className={cx("td-map-pin-label", "td-react-map-pin-label", !showLabels && "td-react-map-pin-label--quiet")}>
              {pin.label}
              {pin.description ? <span className="td-react-map-pin-description"> {pin.description}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
});
