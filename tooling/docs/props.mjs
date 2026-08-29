/**
 * Derive the docs' props tables from `packages/react/src/*.tsx`.
 *
 * A `Doc` entry holds two kinds of content. The summary, the code sample and
 * the live preview are editorial — a person decides what a component is for and
 * how to show it, and generating those produces worse docs, not fewer. The
 * props table is not editorial: it is the component's own interface retyped by
 * hand, which is exactly the kind of duplication that goes stale in silence.
 *
 * This reads the interfaces and the component's default values and writes
 * `apps/docs/src/props.generated.json`, which the docs import.
 *
 *   node tooling/docs/props.mjs [--check]
 */

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const PACKAGE_SRC = resolve(ROOT, "packages/react/src");
const TARGET = resolve(ROOT, "apps/docs/src/props.generated.json");
const CHECK = process.argv.includes("--check");

/** Docs id -> the module and the props interface behind it. */
const TABLES = {
  "button": ["button", "ButtonProps", "Button"],
  "badge": ["badge", "BadgeProps", "Badge"],
  "card": ["card", "CardProps", "Card"],
  "input": ["input", "InputProps", "Input"],
  "textarea": ["input", "TextareaProps", "Textarea"],
  "form-field": ["form-field", "FormFieldProps", "FormField"],
  "checkbox": ["selection", "CheckboxProps", "Checkbox"],
  "radio": ["selection", "RadioGroupProps", "RadioGroup"],
  "switch": ["selection", "SwitchProps", "Switch"],
  "alert": ["alert", "AlertProps", "Alert"],
  "tabs": ["tabs", "TabsProps", "Tabs"],
  "kpi": ["kpi-card", "KpiCardProps", "KpiCard"],
  "tooltip": ["tooltip", "TooltipProps", "Tooltip"],
  "dialog": ["dialog", "DialogProps", "Dialog"],
  "dropdown-menu": ["dropdown-menu", "DropdownMenuProps", "DropdownMenu"],
  "toast": ["toast", "ToastProviderProps", "ToastProvider"],
  "chart-container": ["chart-container", "ChartContainerProps", "ChartContainer"],
  "filter-bar": ["filter-bar", "FilterBarProps", "FilterBar"],
  "application-shell": ["application-shell", "ApplicationShellProps", "ApplicationShell"],
  "page-patterns": ["page-patterns", "DashboardPageProps", "DashboardPage"],
  "mega-cascade": ["mega-menu", "MegaCascadeProps", "MegaCascade"],
  "mega-tabs": ["mega-menu", "MegaTabsProps", "MegaTabs"],
  "mega-grid": ["mega-menu", "MegaGridProps", "MegaGrid"],
  "mega-columns": ["mega-menu", "MegaColumnsProps", "MegaColumns"],
  "site-navigation": ["site-navigation", "SiteNavigationProps", "SiteNavigation"],
  "footer": ["footer", "FooterProps", "Footer"],
  // IconButtonProps is an intersection (button + anchor attributes), so the
  // table is cut from the component's own props rather than the DOM passthrough.
  "icon-button": ["icon-button", "IconButtonOwnProps", "IconButton"],
  "article-card": ["article-card", "ArticleCardProps", "ArticleCard"],
  "case-card": ["case-card", "CaseCardProps", "CaseCard"],
  "feature-card": ["feature-card", "FeatureCardProps", "FeatureCard"],
  "comparison-table": ["comparison-table", "ComparisonTableProps", "ComparisonTable"],
  "cta-banner": ["cta-banner", "CtaBannerProps", "CtaBanner"],
  "timeline": ["timeline", "TimelineProps", "Timeline"],
  "prose": ["prose", "ProseProps", "Prose"],
  "rect-title": ["rect-title", "RectTitleProps", "RectTitle"],
  "filament-button": ["filament-button", "FilamentButtonProps", "FilamentButton"],
  "side-tabs": ["filament-button", "SideTabsProps", "SideTabs"],
  "split-button": ["split-button", "SplitButtonProps", "SplitButton"],
  "search-bar": ["search-bar", "SearchBarProps", "SearchBar"],
  "frame": ["frame", "FrameProps", "Frame"],
  "progress": ["progress", "ProgressProps", "Progress"],
  "range": ["range", "RangeProps", "Range"],
  "faq": ["faq", "FaqProps", "Faq"],
  "link-cells": ["link-cells", "LinkCellsProps", "LinkCells"],
  "logo-strip": ["logo-strip", "LogoStripProps", "LogoStrip"],
  "data-list": ["data-list", "DataListProps", "DataList"],
  "copy-chip": ["copy-chip", "CopyChipProps", "CopyChip"],
  "toc": ["toc", "TableOfContentsProps", "TableOfContents"],
  "file-tree": ["file-tree", "FileTreeProps", "FileTree"],
  "pricing-table": ["pricing-table", "PricingTableProps", "PricingTable"],
  "code-block": ["code-block", "CodeBlockProps", "CodeBlock"],
  "breadcrumbs": ["breadcrumbs", "BreadcrumbsProps", "Breadcrumbs"],
  "pagination": ["pagination", "PaginationProps", "Pagination"],
  "map": ["map", "MapProps", "Map"],
  "profile-card": ["profile-card", "ProfileCardProps", "ProfileCard"],
  "theme-toggle": ["theme-toggle", "ThemeToggleProps", "ThemeToggle"],
};

/** The members of `interface <name> { … }`, with doc comments stripped. */
function interfaceMembers(source, name) {
  const start = source.indexOf(`interface ${name}`);
  if (start < 0) return [];
  const open = source.indexOf("{", start);
  let depth = 0, end = open;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    else if (source[i] === "}") { depth -= 1; if (!depth) { end = i; break; } }
  }
  const body = source.slice(open + 1, end)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "");

  const members = [];
  let buffer = "", depthTracker = 0;
  for (const char of body) {
    if ("{([<".includes(char)) depthTracker += 1;
    if ("})]>".includes(char)) depthTracker -= 1;
    if (char === ";" && depthTracker <= 0) { members.push(buffer.trim()); buffer = ""; continue; }
    buffer += char;
  }
  if (buffer.trim()) members.push(buffer.trim());

  return members.filter(Boolean).map(member => {
    const match = member.match(/^\[?["']?([A-Za-z_$][\w$-]*)["']?\]?(\?)?\s*:\s*([\s\S]+)$/);
    if (!match) return null;
    return { name: match[1], optional: Boolean(match[2]), type: match[3].replace(/\s+/g, " ").trim() };
  }).filter(Boolean);
}

/**
 * Default values, read from the component's destructured parameter list.
 * `{ variant = "secondary", size = "md", … }` is where the real defaults live —
 * the interface only says a prop is optional.
 */
function defaults(source, component) {
  const start = source.indexOf(`function ${component}(`);
  if (start < 0) return {};
  const open = source.indexOf("{", start);
  let depth = 0, end = open;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    else if (source[i] === "}") { depth -= 1; if (!depth) { end = i; break; } }
  }
  const params = source.slice(open + 1, end);
  const found = {};
  for (const match of params.matchAll(/([A-Za-z_$][\w$]*)\s*=\s*("[^"]*"|'[^']*'|`[^`]*`|\{[^}]*\}|\[[^\]]*\]|[\w.]+)/g)) {
    found[match[1]] = match[2];
  }
  return found;
}

const tables = {};
for (const [id, [module, iface, component]] of Object.entries(TABLES)) {
  const source = await readFile(resolve(PACKAGE_SRC, `${module}.tsx`), "utf8");
  const members = interfaceMembers(source, iface);
  if (!members.length) {
    console.error(`No members found for ${iface} in ${module}.tsx — has it been renamed?`);
    process.exit(1);
  }
  const fallbacks = defaults(source, component);
  tables[id] = members.map(member => [
    member.name,
    member.type,
    fallbacks[member.name] ?? (member.optional ? "—" : "required"),
  ]);
}

const serialised = JSON.stringify(tables, null, 2) + "\n";
const current = await readFile(TARGET, "utf8").catch(() => null);

if (CHECK) {
  if (current !== serialised) {
    console.error("apps/docs/src/props.generated.json is out of date. Run: pnpm docs:props");
    process.exit(1);
  }
  console.log(`Docs props are up to date — ${Object.keys(tables).length} tables.`);
} else if (current === serialised) {
  console.log(`Docs props already up to date — ${Object.keys(tables).length} tables.`);
} else {
  await writeFile(TARGET, serialised);
  console.log(`Wrote ${Object.keys(tables).length} props tables to apps/docs/src/props.generated.json`);
}
