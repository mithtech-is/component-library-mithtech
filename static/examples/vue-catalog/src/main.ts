import { createApp, defineComponent, h, ref } from "vue";
import { TdBadge, TdButton, TdCard, TdCardContent, TdCardHeader, TdCardTitle, TdFormField, TdInput, TdTextarea } from "@mithtech-bengaluru/tonaldepth-vue";
import "@mithtech-bengaluru/tonaldepth-vue/styles.css";
import "./styles.css";

const Catalog = defineComponent({
  setup() {
    const dark = ref(false);
    const compact = ref(false);
    const toggleTheme = () => { dark.value = !dark.value; document.documentElement.dataset.theme = dark.value ? "dark" : "light"; };
    const toggleDensity = () => { compact.value = !compact.value; document.documentElement.dataset.density = compact.value ? "compact" : "comfortable"; };
    return () => h("main", { class: "vue-catalog" }, [
      h("header", { class: "vue-catalog-head" }, [h("div", [h(TdBadge, { variant: "brand" }, { default: () => "Vue P0" }), h("h1", { class: "td-page-title" }, "Vue foundation"), h("p", { class: "td-page-sub" }, "Internal rendered QA—not the documentation layer.")]), h("div", { class: "td-btn-row" }, [h(TdButton, { size: "sm", onClick: toggleTheme }, { default: () => dark.value ? "Light theme" : "Dark theme" }), h(TdButton, { size: "sm", onClick: toggleDensity }, { default: () => compact.value ? "Comfortable" : "Compact" })])]),
      h("section", { class: "vue-grid", "aria-label": "Vue component examples" }, [
        h(TdCard, null, { default: () => [h(TdCardHeader, null, { default: () => [h(TdCardTitle, null, { default: () => "Buttons" }), h(TdBadge, { variant: "success" }, { default: () => "Verified" })] }), h(TdCardContent, { class: "td-btn-row" }, { default: () => [h(TdButton, { variant: "primary" }, { default: () => "Primary" }), h(TdButton, { variant: "secondary" }, { default: () => "Secondary" }), h(TdButton, { variant: "outline" }, { default: () => "Outline" }), h(TdButton, { loading: true, loadingLabel: "Saving" }, { default: () => "Save" })] })] }),
        h(TdCard, { depth: "inset" }, { default: () => [h(TdCardHeader, null, { default: () => h(TdCardTitle, null, { default: () => "Badges" }) }), h(TdCardContent, { class: "td-btn-row" }, { default: () => [h(TdBadge, null, { default: () => "Neutral" }), h(TdBadge, { variant: "brand" }, { default: () => "Brand" }), h(TdBadge, { variant: "success" }, { default: () => "Ready" }), h(TdBadge, { variant: "danger" }, { default: () => "Error" })] })] }),
        h(TdCard, { class: "vue-form" }, { default: () => [h(TdCardHeader, null, { default: () => h(TdCardTitle, null, { default: () => "Form fields" }) }), h(TdCardContent, { class: "td-form" }, { default: () => [h(TdFormField, { label: "Work email", helperText: "Used for account notifications", required: true }, { default: () => h(TdInput, { type: "email", placeholder: "name@company.com" }) }), h(TdFormField, { label: "Summary", error: "Add at least one sentence" }, { default: () => h(TdTextarea, { placeholder: "Describe the work" }) })] })] }),
      ]),
    ]);
  },
});
createApp(Catalog).mount("#app");
