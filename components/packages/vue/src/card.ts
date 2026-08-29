import { defineComponent, h, mergeProps, type PropType } from "vue";
import { cx } from "./utils";
export type CardDepth = "raised" | "flat" | "inset";
function element(name: string, tag: string, base: string) {
  return defineComponent({ name, inheritAttrs: false, setup(_, { attrs, slots }) { return () => h(tag, mergeProps(attrs, { class: cx(base, attrs.class as string) }), slots.default?.()); } });
}
export const TdCard = defineComponent({
  name: "TdCard", inheritAttrs: false,
  props: { depth: { type: String as PropType<CardDepth>, default: "raised" } },
  setup(props, { attrs, slots }) { return () => h("div", mergeProps(attrs, { class: cx("td-panel", `td-vue-card--${props.depth}`, attrs.class as string) }), slots.default?.()); },
});
export const TdCardHeader = element("TdCardHeader", "div", "td-panel-head");
export const TdCardTitle = element("TdCardTitle", "h3", "td-panel-title");
export const TdCardContent = element("TdCardContent", "div", "td-vue-card-content");
