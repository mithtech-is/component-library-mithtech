"use client";

import { forwardRef, useCallback, useEffect, useState, type ButtonHTMLAttributes } from "react";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import "./tonaldepth-theme-toggle.css";

const LAMP_WEIGHT = "fill" as const;

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
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

  const toggle = useCallback(() => {
    const next: TonalDepthTheme = (theme ?? TonalDepthresolveTheme()) === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    setTheme(next);
    try {
      if (storageKey) window.localStorage.setItem(storageKey, next);
    } catch {
      // As above — the toggle still works, the choice just will not survive.
    }
    onThemeChange?.(next);
  }, [theme, storageKey, onThemeChange]);

  const isDark = theme === "dark";
  return (
    <button
      {...props}
      ref={ref}
      type="button"
      onClick={toggle}
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
