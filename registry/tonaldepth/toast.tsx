"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode, type SVGProps } from "react";
import "./tonaldepth-toast.css";

const LAMP_WEIGHT = "fill" as const;

/**
 * TonalDepth's own glyphs, copied in because a registry item is one
 * self-contained file. Filled and colour-neutral by construction, so the
 * component's lamp ladder moves them through `currentColor`.
 */
interface TdIconProps extends SVGProps<SVGSVGElement> {
  /** Edge length. `1em` so the glyph scales with the type it sits beside. */
  size?: number | string;
  /** The fill. `currentColor` so the lamp ramp can move it. */
  color?: string;
  /**
   * Accepted so a TD glyph is a drop-in at a call site passing
   * `weight={LAMP_WEIGHT}`. TD glyphs are filled by construction, so there is
   * nothing to switch — the prop is swallowed rather than forwarded, because
   * `weight` is not an SVG attribute and React would put it on the DOM.
   */
  weight?: string;
  /** Flip horizontally, matching Phosphor's prop of the same name. */
  mirrored?: boolean;
}

/** `fillRule` comes from `SVGProps`; pass `evenodd` where the artwork knocks a
 *  hole out of its own outline. */
interface TdGlyphProps extends TdIconProps {
  viewBox: string;
  d: string;
}

function TdGlyph({ viewBox, d, fillRule, size = "1em", color = "currentColor", weight, mirrored, ...props }: TdGlyphProps) {
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
      <path d={d} fillRule={fillRule} />
    </svg>
  );
}

// A bare cross, drawn as one filled polygon: two 40-unit bars crossing at the
// centre, tips at 30.4/225.6. Not a stroked path — the set is filled by
// construction, and a stroke cannot carry the lamp's glow.
const CLOSE = "M58.7,225.6 30.4,197.3 99.7,128 30.4,58.7 58.7,30.4 128,99.7 197.3,30.4 225.6,58.7 156.3,128 225.6,197.3 197.3,225.6 128,156.3Z";

/**
 * The dismiss mark. A bare cross.
 *
 * Phosphor's `X` cannot be used: at `fill` weight a stroke-only glyph renders
 * as a filled square PLATE with the mark knocked out of it. Its `XCircle` —
 * which this replaces — is a solid disc, and at the 13px a dismiss control
 * uses that reads as a hole punched in the surface rather than as a mark on
 * it, which is the one move the system forbids. The bar and the disc were
 * also the same glyph as CancelIcon, so dismissing a panel and refusing an
 * action looked identical.
 */
function TdClose(props: TdIconProps) {
  return <TdGlyph viewBox="0 0 256 256" d={CLOSE} {...props} />;
}

const CloseIcon = TdClose;

export type TonalDepthToastVariant = "info" | "success" | "error";

export interface TonalDepthToastInput { title: ReactNode; description?: ReactNode; variant?: TonalDepthToastVariant; duration?: number }

interface TonalDepthToastRecord extends TonalDepthToastInput { id: number }

interface TonalDepthToastContextValue { toast: (input: TonalDepthToastInput) => number; dismiss: (id: number) => void }

const TonalDepthToastContext = createContext<TonalDepthToastContextValue | null>(null);

export interface TonalDepthToastProviderProps { children: ReactNode; defaultDuration?: number }

export function TonalDepthToastProvider({ children, defaultDuration = 4000 }: TonalDepthToastProviderProps) {
  const [toasts, setToasts] = useState<TonalDepthToastRecord[]>([]);
  const sequence = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const dismiss = useCallback((id: number) => { const timer = timers.current.get(id); if (timer) clearTimeout(timer); timers.current.delete(id); setToasts(current => current.filter(item => item.id !== id)); }, []);
  const toast = useCallback((input: TonalDepthToastInput) => {
    const id = ++sequence.current;
    setToasts(current => [...current, { ...input, id, variant: input.variant ?? "info" }]);
    const duration = input.duration ?? defaultDuration;
    if (duration > 0) timers.current.set(id, setTimeout(() => dismiss(id), duration));
    return id;
  }, [defaultDuration, dismiss]);
  useEffect(() => () => timers.current.forEach(timer => window.clearTimeout(timer)), []);
  return (
    <TonalDepthToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="td-registry-toast-viewport" aria-live="polite" aria-atomic="false">
        {toasts.map(item => <div key={item.id} className={`td-toast td-toast--${item.variant} td-registry-toast td-registry-toast--${item.variant}`} role={item.variant === "error" ? "alert" : "status"}><span className="td-registry-toast-lamp" aria-hidden="true" /><div><strong>{item.title}</strong>{item.description ? <p>{item.description}</p> : null}</div><button type="button" className="td-toast-close td-registry-toast-close" aria-label="Dismiss notification" onClick={() => dismiss(item.id)}><CloseIcon weight={LAMP_WEIGHT} /></button></div>)}
      </div>
    </TonalDepthToastContext.Provider>
  );
}

export function useTonalDepthToast(): TonalDepthToastContextValue {
  const value = useContext(TonalDepthToastContext);
  if (!value) throw new Error("useTonalDepthToast must be used within TonalDepthToastProvider");
  return value;
}
