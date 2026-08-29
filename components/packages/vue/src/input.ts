import { defineComponent, h, inject, mergeProps, nextTick, ref, watch } from "vue";
import { cx } from "./utils";
import { fieldContextKey } from "./field-context";

export const TdInput = defineComponent({
  name: "TdInput", inheritAttrs: false,
  props: { modelValue: { type: [String, Number], default: undefined }, invalid: Boolean, disabled: Boolean, containerClass: { type: String, default: undefined } },
  emits: ["update:modelValue"],
  setup(props, { attrs, slots, emit, expose }) {
    const field = inject(fieldContextKey, null);
    const localValue = ref(props.modelValue);
    watch(() => props.modelValue, value => { localValue.value = value; });
    let element: HTMLInputElement | null = null;
    expose({ get element() { return element; } });
    return () => {
      const invalid = props.invalid || field?.invalid.value || attrs["aria-invalid"] === true || attrs["aria-invalid"] === "true";
      return h("span", { class: cx("td-input-wrap", props.containerClass), "data-state": invalid ? "error" : undefined, "data-disabled": props.disabled || undefined }, [
        slots.leading ? h("span", { class: "td-input-icon", "aria-hidden": "true" }, slots.leading()) : null,
        h("input", mergeProps(attrs, {
          ref: (node: unknown) => { element = node as HTMLInputElement | null; },
          ...(props.modelValue !== undefined ? { value: localValue.value } : {}),
          id: attrs.id ?? field?.id,
          required: attrs.required ?? (field?.required.value || undefined),
          "aria-describedby": attrs["aria-describedby"] ?? (field?.hasMessage.value ? field.messageId : undefined),
          disabled: props.disabled,
          "aria-invalid": invalid || undefined,
          class: cx("td-input", attrs.class as string),
          onInput: props.modelValue !== undefined ? (event: Event) => { const value = (event.target as HTMLInputElement).value; localValue.value = value; emit("update:modelValue", value); void nextTick(() => { if (element && element.value !== value) element.value = value; }); } : undefined,
        })),
        slots.trailing ? h("span", { class: "td-input-trailing" }, slots.trailing()) : null,
      ]);
    };
  },
});

export const TdTextarea = defineComponent({
  name: "TdTextarea", inheritAttrs: false,
  props: { modelValue: { type: String, default: undefined }, invalid: Boolean, disabled: Boolean, containerClass: { type: String, default: undefined } },
  emits: ["update:modelValue"],
  setup(props, { attrs, emit, expose }) {
    const field = inject(fieldContextKey, null);
    const localValue = ref(props.modelValue);
    watch(() => props.modelValue, value => { localValue.value = value; });
    let element: HTMLTextAreaElement | null = null;
    expose({ get element() { return element; } });
    return () => {
      const invalid = props.invalid || field?.invalid.value || attrs["aria-invalid"] === true || attrs["aria-invalid"] === "true";
      return h("span", { class: cx("td-textarea-wrap", props.containerClass), "data-state": invalid ? "error" : undefined, "data-disabled": props.disabled || undefined }, [
        h("textarea", mergeProps(attrs, {
          ref: (node: unknown) => { element = node as HTMLTextAreaElement | null; },
          ...(props.modelValue !== undefined ? { value: localValue.value } : {}),
          id: attrs.id ?? field?.id,
          required: attrs.required ?? (field?.required.value || undefined),
          "aria-describedby": attrs["aria-describedby"] ?? (field?.hasMessage.value ? field.messageId : undefined),
          disabled: props.disabled,
          "aria-invalid": invalid || undefined,
          class: cx("td-textarea", attrs.class as string),
          onInput: props.modelValue !== undefined ? (event: Event) => { const value = (event.target as HTMLTextAreaElement).value; localValue.value = value; emit("update:modelValue", value); void nextTick(() => { if (element && element.value !== value) element.value = value; }); } : undefined,
        })),
      ]);
    };
  },
});
