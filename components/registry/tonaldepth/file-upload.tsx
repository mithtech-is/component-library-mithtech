"use client";

import { forwardRef, useEffect, useRef, useState, type DragEvent, type InputHTMLAttributes, type ReactNode, type SVGProps } from "react";
import "./tonaldepth-file-upload.css";

const LAMP_WEIGHT = "fill" as const;

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

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

/** `document_24_filled` */
function FileIcon(props: FluentIconProps) {
  return <FluentGlyph viewBox="0 0 24 24" d="M12 2v6c0 1.1.9 2 2 2h6v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4c0-1.1.9-2 2-2zm1.5.5V8c0 .28.22.5.5.5h5.5z" {...props} />;
}

export interface TonalDepthFileUploadProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange" | "files" | "title"> {
  /** The chosen files. Controlled — pair with `onFilesChange`. */
  files?: File[];
  onFilesChange?: (files: File[]) => void;
  /** Headline inside the zone. */
  title?: ReactNode;
  /** The line under it — say the limits here, not in a tooltip. */
  hint?: ReactNode;
  /**
   * Draw a thumbnail for each image file. This is what makes the component an
   * image upload; it does nothing for a file the browser cannot render.
   */
  preview?: boolean;
  /** Refuse anything larger, in bytes. */
  maxSize?: number;
  invalid?: boolean;
  containerClassName?: string;
}

const TonalDepthformatSize = (bytes: number) =>
  bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export const TonalDepthFileUpload = forwardRef<HTMLInputElement, TonalDepthFileUploadProps>(function TonalDepthFileUpload(
  {
    files, onFilesChange, title = "Drop a file here", hint = "or browse", preview = false,
    maxSize, multiple, accept, invalid = false, disabled, className, containerClassName,
    "aria-invalid": ariaInvalid, id, ...props
  },
  ref,
) {
  const [uncontrolled, setUncontrolled] = useState<File[]>([]);
  const [over, setOver] = useState(false);
  const [rejected, setRejected] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chosen = files ?? uncontrolled;
  const effectiveInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";

  const commit = (next: File[]) => {
    if (files === undefined) setUncontrolled(next);
    onFilesChange?.(next);
  };

  const accepted = (incoming: File[]) => {
    const tooBig = maxSize !== undefined ? incoming.filter(f => f.size > maxSize) : [];
    setRejected(tooBig.length ? `${tooBig[0]!.name} is larger than ${TonalDepthformatSize(maxSize!)}` : null);
    const ok = maxSize !== undefined ? incoming.filter(f => f.size <= maxSize) : incoming;
    return multiple ? [...chosen, ...ok] : ok.slice(0, 1);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setOver(false);
    if (disabled) return;
    commit(accepted([...event.dataTransfer.files]));
  };

  return (
    <div className={cx("td-registry-upload", containerClassName)}>
      <div
        className="td-dropzone"
        data-state={over ? "over" : undefined}
        data-disabled={disabled || undefined}
        onDragOver={event => { event.preventDefault(); if (!disabled) setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        <FileIcon className="td-dropzone-icon" weight={LAMP_WEIGHT} aria-hidden="true" />
        <span className="td-dropzone-title">{title}</span>
        <span className="td-dropzone-text">{hint}</span>
        {/*
          The input covers the zone rather than sitting beside it, so the whole
          plate is one target for the pointer and one stop for the keyboard —
          a visually-hidden input would leave the zone unreachable by Tab.
        */}
        <input
          {...props}
          ref={node => {
            inputRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          id={id}
          type="file"
          className={cx("td-dropzone-browse", className)}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          aria-invalid={effectiveInvalid || undefined}
          onChange={event => commit(accepted([...(event.target.files ?? [])]))}
        />
      </div>

      {rejected ? <p className="td-registry-upload-reject" role="alert">{rejected}</p> : null}

      {chosen.length ? (
        <ul className="td-registry-upload-list">
          {chosen.map(file => (
            <li className="td-registry-upload-item" key={`${file.name}-${file.size}`}>
              {preview && file.type.startsWith("image/") ? <TonalDepthThumb file={file} /> : null}
              <span className="td-registry-upload-name">{file.name}</span>
              <span className="td-registry-upload-size">{TonalDepthformatSize(file.size)}</span>
              <button
                type="button"
                className="td-taginput-x"
                aria-label={`Remove ${file.name}`}
                disabled={disabled}
                onClick={() => commit(chosen.filter(f => f !== file))}
              >
                <CloseIcon weight={LAMP_WEIGHT} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
});

/** An object URL for one picked image, revoked when the item goes. */
function TonalDepthThumb({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url ? <img className="td-registry-upload-thumb" src={url} alt="" /> : <span className="td-registry-upload-thumb" />;
}
