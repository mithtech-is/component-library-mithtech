import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "../lib/cn"

/**
 * Structure and API are shadcn's; every visual decision is TonalDepth's and
 * lives in `styles/button.css`. No utility classes here — the variants map to
 * semantic hooks and nothing else, so a design change never touches this file.
 */
const buttonVariants = cva("td-button", {
  variants: {
    variant: {
      default: "td-button-variant-default",
      secondary: "td-button-variant-secondary",
      filled: "td-button-variant-filled",
      destructive: "td-button-variant-destructive",
      outline: "td-button-variant-outline",
      ghost: "td-button-variant-ghost",
      link: "td-button-variant-link",
    },
    size: {
      xs: "td-button-size-xs",
      sm: "td-button-size-sm",
      default: "td-button-size-default",
      lg: "td-button-size-lg",
      icon: "td-button-size-icon",
      "icon-sm": "td-button-size-icon-sm",
      "icon-lg": "td-button-size-icon-lg",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  dot,
  loading = false,
  glow,
  children,
  disabled,
  style,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    /**
     * The 7px status lamp before the label — a live state the button reports,
     * not an emphasis. TonalDepth's own concept; shadcn has no equivalent.
     */
    dot?: boolean
    /** Swaps the leading glyph for a spinner and disables the control. */
    loading?: boolean
    /**
     * Overrides the colour this button's lamp lights, for the channel buttons
     * (WhatsApp, call, email) where the glyph signals which channel.
     */
    glow?: string
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={Comp === "button" ? disabled || loading : undefined}
      style={glow ? { ...style, ["--td-lamp-glow" as string]: glow } : style}
      {...props}
    >
      {dot ? <span className="td-button-dot" aria-hidden="true" /> : null}
      {loading ? <span className="td-button-spinner" aria-hidden="true" /> : null}
      {children}
    </Comp>
  )
}

export { Button, buttonVariants }
