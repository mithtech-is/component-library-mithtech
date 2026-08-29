import { computed, defineComponent, h, provide, useId, type PropType } from "vue";
import { fieldContextKey } from "./field-context";
export const TdFormField = defineComponent({
  name: "TdFormField",
  inheritAttrs: false,
  props: {
    label: { type: [String, Number] as PropType<string | number>, required: true },
    for: { type: String, default: undefined },
    helperText: { type: [String, Number] as PropType<string | number>, default: undefined },
    error: { type: [String, Number] as PropType<string | number>, default: undefined },
    required: Boolean,
    optional: Boolean,
  },
  setup(props, { slots, attrs }) {
    const generated = useId();
    const id = props.for ?? generated;
    const messageId = `${id}-message`;
    provide(fieldContextKey, {
      id,
      messageId,
      required: computed(() => props.required),
      invalid: computed(() => props.error !== undefined),
      hasMessage: computed(() => props.error !== undefined || props.helperText !== undefined),
    });
    return () => {
      const nodes = slots.default?.() ?? [];
      return h("div", { ...attrs, class: ["td-field", attrs.class], "data-invalid": props.error !== undefined || undefined }, [
        h("label", { class: "td-label", for: id }, [slots.label?.() ?? props.label, props.required ? h("span", { class: "td-label-required", "aria-hidden": "true" }, "*") : null, props.optional ? h("span", { class: "td-label-optional" }, "Optional") : null]),
        nodes,
        props.error !== undefined ? h("p", { id: messageId, class: "td-helper td-helper--error", role: "alert" }, props.error) : props.helperText !== undefined ? h("p", { id: messageId, class: "td-helper" }, props.helperText) : null,
      ]);
    };
  },
});
