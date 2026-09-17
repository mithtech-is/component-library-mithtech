/**
 * Join class names, dropping anything falsy.
 *
 * shadcn's `cn` is `twMerge(clsx(...))` — the merge exists to resolve conflicts
 * between competing Tailwind utilities (`px-4` vs `px-2`). This library styles
 * through semantic `td-*` hooks and plain CSS, so there are no utilities to
 * deconflict and the merge would be dead weight in every consumer's bundle.
 */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}
