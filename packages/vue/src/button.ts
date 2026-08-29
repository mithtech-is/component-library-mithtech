import { defineComponent, h, mergeProps, type PropType } from "vue";
import { cx } from "./utils";

// `primary` is the design system's primary button — the surface housing, not a
// fill. The papaya fill is `filled`, and React means the same thing by both
// names; a variant that means one thing in one package and its opposite in
// another is worse than no variant at all.
export type ButtonVariant = "primary" | "secondary" | "filled" | "outline" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";
const variants: Record<ButtonVariant, string> = {
  primary: "td-primary", secondary: "td-primary", filled: "td-coloured",
  outline: "td-primary td-vue-button--outline",
  ghost: "td-primary td-vue-button--ghost", destructive: "td-coloured td-vue-button--destructive",
};
/** The variants drawn on a filled housing, and so carrying the white label. */
const FILLED: ButtonVariant[] = ["filled", "destructive"];

export const TdButton = defineComponent({
  name: "TdButton", inheritAttrs: false,
  props: {
    variant: { type: String as PropType<ButtonVariant>, default: "secondary" },
    size: { type: String as PropType<ButtonSize>, default: "md" },
    loading: Boolean,
    loadingLabel: { type: String, default: "Loading" },
    disabled: Boolean,
  },
  setup(props, { attrs, slots, expose }) {
    let element: HTMLButtonElement | null = null;
    expose({ get element() { return element; } });
    return () => h("button", mergeProps(attrs, {
      ref: (node: unknown) => { element = node as HTMLButtonElement | null; },
      type: attrs.type ?? "button",
      disabled: props.disabled || props.loading,
      "aria-busy": props.loading || undefined,
      class: cx(variants[props.variant], `td-vue-button--${props.size}`, attrs.class as string),
    }), [
      props.loading ? h("span", { class: "td-vue-spinner", "aria-hidden": "true" }) : slots.leading?.(),
      h("span", { class: FILLED.includes(props.variant) ? "td-coloured-label" : "td-primary-label" }, props.loading ? props.loadingLabel : slots.default?.()),
      !props.loading ? slots.trailing?.() : null,
    ]);
  },
});
