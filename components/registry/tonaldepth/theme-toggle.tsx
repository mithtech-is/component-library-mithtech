"use client";

import { forwardRef, useCallback, useEffect, useRef, useState, type ButtonHTMLAttributes } from "react";
import "./tonaldepth-theme-toggle.css";

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

/** `weather_moon_24_filled` */
function MoonIcon(props: FluentIconProps) {
  return <FluentGlyph viewBox="0 0 24 24" d="M20.03 17a10 10 0 0 1-16.9.68.75.75 0 0 1 .36-1.13c3.77-1.35 5.79-2.91 6.96-5.15 1.23-2.35 1.55-4.93.69-8.46A.75.75 0 0 1 11.9 2 10 10 0 0 1 20.03 17" {...props} />;
}

/** `weather_sunny_24_filled` */
function SunIcon(props: FluentIconProps) {
  return <FluentGlyph viewBox="0 0 24 24" d="M12 2c.41 0 .75.34.75.75v1.5a.75.75 0 0 1-1.5 0v-1.5c0-.41.34-.75.75-.75m5 10a5 5 0 1 1-10 0 5 5 0 0 1 10 0m4.25.75a.75.75 0 0 0 0-1.5h-1.5a.75.75 0 0 0 0 1.5zM12 19c.41 0 .75.34.75.75v1.5a.75.75 0 0 1-1.5 0v-1.5c0-.41.34-.75.75-.75m-7.75-6.25a.75.75 0 0 0 0-1.5h-1.5a.75.75 0 0 0 0 1.5zm-.03-8.53c.3-.3.77-.3 1.06 0l1.5 1.5a.75.75 0 0 1-1.06 1.06l-1.5-1.5a.75.75 0 0 1 0-1.06m1.06 15.56a.75.75 0 1 1-1.06-1.06l1.5-1.5a.75.75 0 1 1 1.06 1.06zm14.5-15.56a.75.75 0 0 0-1.06 0l-1.5 1.5a.75.75 0 0 0 1.06 1.06l1.5-1.5c.3-.3.3-.77 0-1.06m-1.06 15.56a.75.75 0 1 0 1.06-1.06l-1.5-1.5a.75.75 0 1 0-1.06 1.06z" {...props} />;
}

export type TonalDepthTheme = "light" | "dark";

export interface TonalDepthThemeToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  /** Where the choice is remembered. `null` keeps it for the session only. */
  storageKey?: string | null;
  /** Accessible name, given the theme the press will switch *to*. */
  labels?: Record<TonalDepthTheme, string>;
  /**
   * Show visible text beside the icon, turning the round button into a pill.
   * The accessible name still comes from `labels`, so a screen reader hears
   * the full sentence while the pill stays short.
   */
  showLabel?: boolean;
  /** The visible text, keyed by the theme the press will switch *to*. */
  labelText?: Record<TonalDepthTheme, string>;
  onThemeChange?: (theme: TonalDepthTheme) => void;
}

function TonalDepthresolveTheme(): TonalDepthTheme {
  const stamped = document.documentElement.getAttribute("data-theme");
  if (stamped === "light" || stamped === "dark") return stamped;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * The system's theme switch: a round icon button whose sun and moon are lamps.
 *
 * `.td-icon-sun` and `.td-icon-moon` are swapped by CSS on `[data-theme]`, so
 * the component's job is to keep that attribute stamped — including in the
 * "system" state, where nothing is stamped and only `prefers-color-scheme`
 * separates the two. Until it mounts there is no attribute to read, so the
 * button renders unpressed and corrects itself in an effect rather than
 * guessing during render and mismatching on hydration.
 */
export const TonalDepthThemeToggle = forwardRef<HTMLButtonElement, TonalDepthThemeToggleProps>(function TonalDepthThemeToggle(
  {
    storageKey = "td-theme",
    labels = { light: "Switch to light theme", dark: "Switch to dark theme" },
    showLabel = false,
    labelText = { light: "Light mode", dark: "Dark mode" },
    onThemeChange,
    className,
    onClick,
    ...props
  },
  ref,
) {
  const [theme, setTheme] = useState<TonalDepthTheme | null>(null);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = storageKey ? window.localStorage.getItem(storageKey) : null;
    } catch {
      // Private windows and blocked site data throw on read. The OS preference
      // is a fine answer; losing the stored choice is not worth failing over.
    }
    const initial: TonalDepthTheme = stored === "light" || stored === "dark" ? stored : TonalDepthresolveTheme();
    document.documentElement.setAttribute("data-theme", initial);
    setTheme(initial);

    // The theme lives on the document, so it can be changed by something that
    // is not this button — a second toggle elsewhere on the page, or the app's
    // own settings screen. Without this, a component that renders the current
    // theme (an `aria-pressed`, a visible label) keeps showing the value it
    // read at mount and silently disagrees with the page around it.
    const observer = new MutationObserver(() => {
      const current = document.documentElement.getAttribute("data-theme");
      if (current === "light" || current === "dark") setTheme(current);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, [storageKey]);

  const apply = useCallback((next: TonalDepthTheme) => {
    document.documentElement.setAttribute("data-theme", next);
    try {
      if (storageKey) window.localStorage.setItem(storageKey, next);
    } catch {
      // As above — the toggle still works, the choice just will not survive.
    }
  }, [storageKey]);

  /* The pending re-assertion, cleared on unmount so a toggle pressed on its way
     off the page does not write the theme after it has gone. */
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (settle.current) clearTimeout(settle.current); }, []);

  const toggle = useCallback(() => {
    const next: TonalDepthTheme = (theme ?? TonalDepthresolveTheme()) === "dark" ? "light" : "dark";
    apply(next);
    setTheme(next);

    /* ── The write is an ASSERTION, not a flip ────────────────────────
       A page can carry a vanilla runtime that binds every
       `button:has(.td-theme-icon)` and toggles the theme itself — the old
       design system's `tonaldepth.js` does exactly that, and this component
       renders exactly that markup. Both handlers then fire on one press: this
       one writes the theme the reader asked for, the delegated one flips
       whatever it finds. The theme lands back where it started while storage
       records the new value, so the button appears dead and the NEXT reload
       jumps to the other theme. Dark to dark, key says light.

       So the intent is re-asserted once the click has finished being handled.
       If nothing else touched the attribute this reads it, matches, and does
       nothing; if something flipped it back, the reader's choice wins.

       A task, not a microtask, and that distinction is the whole fix: the HTML
       spec runs a microtask checkpoint whenever the JS stack empties, which
       happens BETWEEN two listeners on the same event. A microtask would
       therefore land before a runtime delegated at the document and be flipped
       straight back — fixing nothing while looking like it had. */
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      settle.current = null;
      if (document.documentElement.getAttribute("data-theme") !== next) apply(next);
    }, 0);

    onThemeChange?.(next);
  }, [theme, apply, onThemeChange]);

  const isDark = theme === "dark";
  return (
    <button
      {...props}
      ref={ref}
      type="button"
      onClick={event => { onClick?.(event); if (!event.defaultPrevented) toggle(); }}
      /* The exemption marker. A vanilla runtime that scans the page for theme
         buttons should skip anything carrying it: this element already owns
         its behaviour, and a second handler on it is a double-toggle rather
         than a second opinion. Stamped whether or not a runtime is present —
         the component cannot know, and an attribute nobody reads costs
         nothing. The `setTimeout` above is what handles a runtime that does
         not read it yet. */
      data-td-bound="theme"
      aria-pressed={isDark}
      aria-label={props["aria-label"] ?? labels[isDark ? "light" : "dark"]}
      className={cx("td-iconbtn", "td-registry-theme-toggle", showLabel && "td-registry-theme-toggle--text", className)}
    >
      {/* Both marks render; the design system's `[data-theme]` rules decide
          which is visible, so the swap costs no JS and cannot desync. `fill`
          weight because the icon is the lamp — see icons.tsx. */}
      <SunIcon className="td-theme-icon td-icon-sun" weight={LAMP_WEIGHT} aria-hidden="true" />
      <MoonIcon className="td-theme-icon td-icon-moon" weight={LAMP_WEIGHT} aria-hidden="true" />
      {showLabel ? <span className="td-registry-theme-toggle-label">{labelText[isDark ? "light" : "dark"]}</span> : null}
    </button>
  );
});
