"use client";

import { forwardRef, useCallback, useEffect, useRef, useState, type ButtonHTMLAttributes } from "react";
import { cx } from "./utils";
import { LAMP_WEIGHT, MoonIcon, SunIcon } from "./icons";
import "./theme-toggle.css";

export type Theme = "light" | "dark";

export interface ThemeToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  /** Where the choice is remembered. `null` keeps it for the session only. */
  storageKey?: string | null;
  /** Accessible name, given the theme the press will switch *to*. */
  labels?: Record<Theme, string>;
  /**
   * Show visible text beside the icon, turning the round button into a pill.
   * The accessible name still comes from `labels`, so a screen reader hears
   * the full sentence while the pill stays short.
   */
  showLabel?: boolean;
  /** The visible text, keyed by the theme the press will switch *to*. */
  labelText?: Record<Theme, string>;
  onThemeChange?: (theme: Theme) => void;
}

function resolveTheme(): Theme {
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
export const ThemeToggle = forwardRef<HTMLButtonElement, ThemeToggleProps>(function ThemeToggle(
  {
    storageKey = "td-theme",
    labels = { light: "Switch to light theme", dark: "Switch to dark theme" },
    showLabel = false,
    labelText = { light: "Light mode", dark: "Dark mode" },
    onThemeChange,
    className,
    ...props
  },
  ref,
) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = storageKey ? window.localStorage.getItem(storageKey) : null;
    } catch {
      // Private windows and blocked site data throw on read. The OS preference
      // is a fine answer; losing the stored choice is not worth failing over.
    }
    const initial: Theme = stored === "light" || stored === "dark" ? stored : resolveTheme();
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

  const apply = useCallback((next: Theme) => {
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
    const next: Theme = (theme ?? resolveTheme()) === "dark" ? "light" : "dark";
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
      onClick={toggle}
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
      className={cx("td-iconbtn", "td-react-theme-toggle", showLabel && "td-react-theme-toggle--text", className)}
    >
      {/* Both marks render; the design system's `[data-theme]` rules decide
          which is visible, so the swap costs no JS and cannot desync. `fill`
          weight because the icon is the lamp — see icons.tsx. */}
      <SunIcon className="td-theme-icon td-icon-sun" weight={LAMP_WEIGHT} aria-hidden="true" />
      <MoonIcon className="td-theme-icon td-icon-moon" weight={LAMP_WEIGHT} aria-hidden="true" />
      {showLabel ? <span className="td-react-theme-toggle-label">{labelText[isDark ? "light" : "dark"]}</span> : null}
    </button>
  );
});
