import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import { TdBadge, TdButton, TdCard, TdCardContent, TdCardHeader, TdCardTitle, TdFormField, TdInput, TdTextarea } from "./index";

describe("Vue P0 components", () => {
  it("forwards button attributes, events, slots, and loading state", async () => {
    const wrapper = mount(TdButton, { attrs: { "data-testid": "save" }, props: { variant: "filled", size: "lg" }, slots: { default: "Save", leading: "→" } });
    expect(wrapper.get("button").classes()).toEqual(expect.arrayContaining(["td-coloured", "td-vue-button--lg"]));
    expect(wrapper.text()).toContain("→Save");
    await wrapper.get("button").trigger("click");
    expect(wrapper.emitted("click")).toHaveLength(1);
    await wrapper.setProps({ loading: true, loadingLabel: "Saving" });
    expect(wrapper.get("button").attributes()).toMatchObject({ disabled: "", "aria-busy": "true" });
    expect(wrapper.text()).toContain("Saving");
  });

  it("supports model updates and invalid input semantics", async () => {
    const wrapper = mount(TdInput, { props: { modelValue: "old", invalid: true }, attrs: { "aria-label": "Name" } });
    const input = wrapper.get("input");
    expect(input.attributes("aria-invalid")).toBe("true");
    await input.setValue("new");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["new"]);
  });

  it("preserves controlled model listeners through FormField cloning", async () => {
    const Parent = defineComponent({
      setup() {
        const value = ref("");
        return () => h(TdFormField, { label: "Email" }, { default: () => h(TdInput, { modelValue: value.value, "onUpdate:modelValue": next => { value.value = String(next); } }) });
      },
    });
    const wrapper = mount(Parent);
    await wrapper.get("input").setValue("team@mith.tech");
    expect((wrapper.get("input").element as HTMLInputElement).value).toBe("team@mith.tech");
  });

  it("connects form labels, help, required state, and errors", () => {
    const wrapper = mount(TdFormField, { props: { label: "Email", helperText: "Work address", required: true }, slots: { default: () => h(TdInput, { type: "email" }) } });
    const input = wrapper.get("input");
    expect(wrapper.get("label").attributes("for")).toBe(input.attributes("id"));
    expect(input.attributes("required")).toBe("");
    expect(input.attributes("aria-describedby")).toBe(wrapper.get(".td-helper").attributes("id"));

    const invalid = mount(TdFormField, { props: { label: "Summary", error: "Required" }, slots: { default: () => h(TdTextarea) } });
    expect(invalid.get("textarea").attributes("aria-invalid")).toBe("true");
    expect(invalid.get('[role="alert"]').text()).toBe("Required");
  });

  it("renders card composition and badge variants", () => {
    const wrapper = mount(TdCard, { props: { depth: "inset" }, slots: { default: () => h(TdCardHeader, null, { default: () => [h(TdCardTitle, null, { default: () => "Status" }), h(TdBadge, { variant: "success" }, { default: () => "Ready" })] }) } });
    expect(wrapper.classes()).toEqual(expect.arrayContaining(["td-panel", "td-vue-card--inset"]));
    expect(wrapper.get("h3").text()).toBe("Status");
    expect(wrapper.get(".td-badge").classes()).toContain("td-badge--green");
  });

  it("renders card content as an extension slot", () => {
    const wrapper = mount(TdCardContent, { slots: { default: "Content" } });
    expect(wrapper.classes()).toContain("td-vue-card-content");
  });

  it("has no critical or serious automated accessibility violations", async () => {
    const wrapper = mount({ render: () => h("main", [h(TdCard, null, { default: () => [h(TdFormField, { label: "Name", helperText: "Public name", required: true }, { default: () => h(TdInput) }), h(TdButton, { variant: "primary" }, { default: () => "Save" }), h(TdBadge, { variant: "success" }, { default: () => "Ready" })] })]) }, { attachTo: document.body });
    const result = await axe.run(wrapper.element, { rules: { "color-contrast": { enabled: false } } });
    expect(result.violations.filter(item => item.impact === "critical" || item.impact === "serious")).toEqual([]);
    wrapper.unmount();
  });
});
