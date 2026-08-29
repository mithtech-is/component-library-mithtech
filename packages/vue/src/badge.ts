import { defineComponent, h, mergeProps, type PropType } from "vue";
import { cx } from "./utils";
export type BadgeVariant = "neutral" | "brand" | "success" | "accent" | "danger";
const variants: Record<BadgeVariant, string> = { neutral: "", brand: "td-badge--brand", success: "td-badge--green", accent: "td-badge--accent", danger: "td-badge--brand td-vue-badge--danger" };
export const TdBadge = defineComponent({
  name: "TdBadge", inheritAttrs: false,
  props: { variant: { type: String as PropType<BadgeVariant>, default: "neutral" } },
  setup(props, { attrs, slots }) { return () => h("span", mergeProps(attrs, { class: cx("td-badge", variants[props.variant], attrs.class as string) }), slots.default?.()); },
});
