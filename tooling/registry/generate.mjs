/**
 * Generate `components/registry/tonaldepth/*.tsx` from `components/packages/react/src/*.tsx`.
 *
 * The two distributions are the same components with a different surface: the
 * registry copies files into a consumer's tree, so its exports are prefixed and
 * it carries no imports a consumer would have to install. That is a mechanical
 * transform, and running it beats maintaining 28 near-copies by hand.
 *
 * The `.css` files are NOT generated. Registry stylesheets are deliberately
 * self-contained — they re-declare the design system's base rules, because a
 * registry consumer has no `@mithtech-bengaluru/tonaldepth-core` to inherit
 * from — while the package's stylesheets carry only the deltas over that core.
 * Different content by design, so they stay hand-authored.
 *
 *   node tooling/registry/generate.mjs [--check]
 *
 * `--check` writes nothing and exits non-zero if any file is out of date, which
 * is what CI wants.
 */

import { readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const PACKAGE_SRC = resolve(ROOT, "components/packages/react/src");
const REGISTRY_SRC = resolve(ROOT, "components/registry/tonaldepth");
const CHECK = process.argv.includes("--check");

/**
 * Which package module each registry item is cut from, and which exports it
 * carries. Several items share a module — the package groups Input with
 * Textarea, and Checkbox with Radio and Switch — so the item cannot be derived
 * from the filename alone. Everything else about the output is computed.
 */
const ITEMS = {
  "button": { module: "button", symbols: ["Button"] },
  "badge": { module: "badge", symbols: ["Badge"] },
  "card": { module: "card", symbols: ["Card", "CardHeader", "CardTitle", "CardContent"] },
  "input": { module: "input", symbols: ["Input"] },
  "textarea": { module: "input", symbols: ["Textarea"] },
  "form-field": { module: "form-field", symbols: ["FormField"] },
  "checkbox": { module: "selection", symbols: ["Checkbox"] },
  "radio": { module: "selection", symbols: ["RadioGroup", "Radio"] },
  "switch": { module: "selection", symbols: ["Switch"] },
  "alert": { module: "alert", symbols: ["Alert"] },
  "tabs": { module: "tabs", symbols: ["Tabs"] },
  "table": { module: "table", symbols: ["TableContainer", "Table", "TableHead", "TableBody", "TableRow", "TableHeader", "TableCell"] },
  "kpi": { module: "kpi-card", symbols: ["KpiCard", "KpiGrid"] },
  "tooltip": { module: "tooltip", symbols: ["Tooltip"] },
  "dialog": { module: "dialog", symbols: ["Dialog"] },
  "dropdown-menu": { module: "dropdown-menu", symbols: ["DropdownMenu"] },
  "toast": { module: "toast", symbols: ["ToastProvider", "useToast"] },
  "chart-container": { module: "chart-container", symbols: ["ChartContainer"], needs: [{ item: "frame", symbols: ["Frame"] }] },
  "filter-bar": { module: "filter-bar", symbols: ["FilterBar"] },
  "application-shell": { module: "application-shell", symbols: ["ApplicationShell"], needs: [{ item: "sub-nav", symbols: ["SubNav"] }] },
  "page-patterns": { module: "page-patterns", symbols: ["DashboardPage", "DashboardPanel", "DataManagementPage", "PageState"] },
  "icon-button": { module: "icon-button", symbols: ["IconButton"] },
  "article-card": { module: "article-card", symbols: ["ArticleCard", "ArticleCardGrid"] },
  "case-card": { module: "case-card", symbols: ["CaseCard", "CaseCardGrid"] },
  "feature-card": { module: "feature-card", symbols: ["FeatureCard", "FeatureGrid"] },
  "comparison-table": { module: "comparison-table", symbols: ["ComparisonTable"] },
  "cta-banner": { module: "cta-banner", symbols: ["CtaBanner"] },
  "timeline": { module: "timeline", symbols: ["Timeline"] },
  "prose": { module: "prose", symbols: ["Prose"] },
  "rect-title": { module: "rect-title", symbols: ["RectTitle", "splitRectTitle"] },
  "filament-button": { module: "filament-button", symbols: ["FilamentButton"] },
  "side-tabs": { module: "filament-button", symbols: ["SideTabs"] },
  "split-button": { module: "split-button", symbols: ["SplitButton"] },
  "search-bar": { module: "search-bar", symbols: ["SearchBar"] },
  "progress": { module: "progress", symbols: ["Progress"] },
  "range": { module: "range", symbols: ["Range"] },
  "faq": { module: "faq", symbols: ["Faq"] },
  "link-cells": { module: "link-cells", symbols: ["LinkCells"] },
  "logo-strip": { module: "logo-strip", symbols: ["LogoStrip"] },
  "data-list": { module: "data-list", symbols: ["DataList"] },
  "copy-chip": { module: "copy-chip", symbols: ["CopyChip"] },
  "toc": { module: "toc", symbols: ["TableOfContents"] },
  "file-tree": { module: "file-tree", symbols: ["FileTree"] },
  "pricing-table": { module: "pricing-table", symbols: ["PricingTable"] },
  "code-block": { module: "code-block", symbols: ["CodeBlock"], needs: [{ item: "frame", symbols: ["Frame"] }, { item: "copy-chip", symbols: ["CopyChip"] }] },
  "breadcrumbs": { module: "breadcrumbs", symbols: ["Breadcrumbs"] },
  "pagination": { module: "pagination", symbols: ["Pagination"] },
  "map": { module: "map", symbols: ["Map"] },
  "whatsapp-form": { module: "whatsapp-form", symbols: ["WhatsAppForm"] },
  "social-button": { module: "social-button", symbols: ["SocialButton"] },
  "profile-card": { module: "profile-card", symbols: ["ProfileCard"] },
  "frame": { module: "frame", symbols: ["Frame", "FrameGrid"] },
  "theme-toggle": { module: "theme-toggle", symbols: ["ThemeToggle"] },
  "mega-cascade": { module: "mega-menu", symbols: ["MegaCascade"] },
  "mega-tabs": { module: "mega-menu", symbols: ["MegaTabs"] },
  "mega-grid": { module: "mega-menu", symbols: ["MegaGrid", "MegaActions"] },
  "mega-columns": { module: "mega-menu", symbols: ["MegaColumns", "MegaFeature"] },
  "site-navigation": { module: "site-navigation", symbols: ["SiteNavigation"] },
  "reading-progress": { module: "reading-progress", symbols: ["ReadingProgress"] },
  "counter": { module: "counter", symbols: ["Counter", "CounterRow"] },
  "testimonial": { module: "testimonial", symbols: ["Testimonial", "TestimonialGrid"] },
  "iso-stack": { module: "iso-stack", symbols: ["IsoStack"] },
  "terminal": { module: "terminal", symbols: ["Terminal"] },
  "file-preview": { module: "file-preview", symbols: ["FilePreview", "FilePreviewList"] },
  "sub-nav": { module: "sub-nav", symbols: ["SubNav"] },
  "page-nav": { module: "page-nav", symbols: ["PageNav"] },
  "chat-launcher": { module: "chat-launcher", symbols: ["ChatLauncher", "AiHalo"] },
  "confirm-button": { module: "confirm-button", symbols: ["ConfirmButton"], needs: [{ item: "button", symbols: ["Button"] }] },
  "multi-step": { module: "multi-step", symbols: ["MultiStep"], needs: [{ item: "button", symbols: ["Button"] }] },
  "spotlight": { module: "spotlight", symbols: ["Spotlight"] },
  "footer": { module: "footer", symbols: ["Footer", "FooterGrid", "FooterBrand", "FooterColumn", "FooterContact", "FooterSocial", "FooterBottom"] },
};

/**
 * Hooks that force a client boundary. `useId` is excluded deliberately: the
 * library treats an id-generating component as server-renderable, and marking
 * FormField or ComparisonTable client-only would push a boundary onto every
 * page that holds a form.
 */
const CLIENT_HOOKS = /\b(useState|useEffect|useLayoutEffect|useReducer|useRef|useContext|createContext|useCallback|useMemo|useSyncExternalStore|useTransition)\b/;

/**
 * What the module imports from React, in source order.
 *
 * Read from the module rather than inferred from a whitelist: `MouseEvent` and
 * `KeyboardEvent` exist both as React types and as DOM globals, and guessing
 * gets it wrong — importing React's `MouseEvent` into a module that calls
 * `addEventListener` shadows the global and stops it compiling.
 */
function reactImportSpecifiers(moduleSource) {
  const match = moduleSource.match(/import \{([^}]*)\} from "react";/);
  if (!match) return [];
  return match[1].split(",").map(part => part.trim()).filter(Boolean);
}

/** `Button` -> `TonalDepthButton`; `useToast` -> `useTonalDepthToast`. */
function prefixed(name) {
  return name.startsWith("use") && name[3] === name[3]?.toUpperCase()
    ? `useTonalDepth${name.slice(3)}`
    : `TonalDepth${name}`;
}

/**
 * Split a module body into top-level statements.
 *
 * Tracks brace depth while skipping over strings, template literals, comments
 * and regex-free JSX text, so a `{` inside a class name or a comment never
 * opens a statement. The sources are hand-written and consistently formatted,
 * which is what makes this safe without a full parser.
 */
function topLevelChunks(body) {
  const chunks = [];
  let depth = 0, start = 0, i = 0;
  const n = body.length;
  while (i < n) {
    const c = body[i];
    if (c === "/" && body[i + 1] === "/") { i = body.indexOf("\n", i); if (i < 0) break; continue; }
    if (c === "/" && body[i + 1] === "*") { i = body.indexOf("*/", i) + 2; continue; }
    if (c === '"' || c === "'" || c === "`") {
      const quote = c;
      i += 1;
      while (i < n && body[i] !== quote) i += body[i] === "\\" ? 2 : 1;
      i += 1;
      continue;
    }
    if (c === "{" || c === "(" || c === "[") depth += 1;
    else if (c === "}" || c === ")" || c === "]") {
      depth -= 1;
      if (depth === 0 && body[i] === "}") {
        // a top-level block closed; consume a trailing `);` or `;`
        let j = i + 1;
        while (j < n && /[);\s]/.test(body[j])) { if (body[j] === "\n" && body.slice(i + 1, j).includes(";")) break; j += 1; }
        chunks.push(body.slice(start, j).trim());
        start = j;
        i = j;
        continue;
      }
    } else if (c === ";" && depth === 0) {
      chunks.push(body.slice(start, i + 1).trim());
      start = i + 1;
    }
    i += 1;
  }
  const tail = body.slice(start).trim();
  if (tail) chunks.push(tail);
  return chunks.filter(Boolean);
}

/** Names a top-level chunk declares. A leading doc comment is skipped, or the
 * declaration it documents would be invisible to the dependency graph. */
function declaredNames(chunk) {
  const code = chunk.replace(/^(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)+/, "");
  const names = [];
  const patterns = [
    /^(?:export\s+)?(?:declare\s+)?(?:abstract\s+)?class\s+(\w+)/,
    /^(?:export\s+)?interface\s+(\w+)/,
    /^(?:export\s+)?type\s+(\w+)/,
    /^(?:export\s+)?(?:const|let|var)\s+(\w+)/,
    /^(?:export\s+)?(?:async\s+)?function\s+(\w+)/,
  ];
  for (const pattern of patterns) {
    const match = code.match(pattern);
    if (match) names.push(match[1]);
  }
  return names;
}

/** Identifiers a chunk references, minus the ones it declares itself. */
function referencedNames(chunk) {
  const own = new Set(declaredNames(chunk));
  const found = new Set();
  for (const match of chunk.matchAll(/\b[A-Za-z_$][\w$]*\b/g)) {
    if (!own.has(match[0])) found.add(match[0]);
  }
  return found;
}


/** Everything above a module's first declaration — its imports and any
 *  `"use client"` — dropped, so only the body is parsed. */
function moduleBody(moduleSource) {
  const lines = moduleSource.split("\n");
  let index = 0;
  while (index < lines.length && (lines[index].trim() === "" || lines[index].startsWith("import ") || lines[index].startsWith('"use client"'))) index += 1;
  return lines.slice(index).join("\n");
}

const ICONS_SOURCE = await readFile(resolve(PACKAGE_SRC, "icons.ts"), "utf8");
const TD_ICONS_SOURCE = await readFile(resolve(PACKAGE_SRC, "td-icons.tsx"), "utf8");
const TD_BRANDS_SOURCE = await readFile(resolve(PACKAGE_SRC, "td-brands.tsx"), "utf8");

/**
 * One `export { … } from "<module>";` block of icons.ts, as role -> local name.
 *
 * Read per block rather than over the whole file, because the file is where
 * TD-first resolution is decided: a role in the `./td-icons` block is drawn by
 * the library, a role in the Phosphor block is not, and the registry has to
 * treat the two completely differently — one is inlined, the other imported.
 */
function aliasBlock(from) {
  const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = ICONS_SOURCE.match(new RegExp(`export \\{([^}]*)\\} from "${escaped}";`));
  if (!match) return {};
  return Object.fromEntries(
    [...match[1].matchAll(/^\s*([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*),/gm)]
      .map(entry => [entry[2], entry[1]]),
  );
}

/** Role name -> Phosphor export, so the registry can never name a glyph the
 *  package does not. */
const ICON_ALIASES = aliasBlock("@phosphor-icons/react");

/** Role name -> TD glyph component. These resolve first; anything absent here
 *  falls through to Phosphor. */
const TD_ALIASES = aliasBlock("./td-icons");

/** td-icons.tsx split into top-level declarations, indexed by the names each
 *  one declares — the same shape buildItem walks for a component module. */
const TD_ICON_CHUNKS = (() => {
  // The module's own doc block tells the reader how to add a glyph to the
  // package. A registry item has no package to add one to, so it is dropped
  // here and replaced by TD_ICON_BANNER on the way out.
  const body = moduleBody(TD_ICONS_SOURCE).replace(/^\s*\/\*\*[\s\S]*?\*\/\s*/, "");
  const chunks = topLevelChunks(body)
    .map(text => ({ text, names: declaredNames(text), refs: referencedNames(text) }));
  const byName = new Map();
  for (const chunk of chunks) for (const name of chunk.names) byName.set(name, chunk);
  return { chunks, byName };
})();

/**
 * The TD glyphs an item needs, as source to paste into it.
 *
 * A registry item is one self-contained file, so a TD role cannot be imported
 * the way a Phosphor one is — there is no package to install. The glyph and
 * whatever it is built from are copied in instead, and aliased to the role
 * name the component body already uses, so the body needs no edit either way.
 */
const TD_ICON_BANNER = `/**
 * TonalDepth's own glyphs, copied in because a registry item is one
 * self-contained file. Filled and colour-neutral by construction, so the
 * component's lamp ladder moves them through \`currentColor\`.
 */
`;

const TD_BRAND_CHUNKS = (() => {
  // Same treatment as the glyph set: the module's own "how to add a mark" doc
  // block is for the package, not for a copied item, so it is dropped here and
  // replaced by TD_BRAND_BANNER on the way out.
  const body = moduleBody(TD_BRANDS_SOURCE).replace(/^\s*\/\*[\s\S]*?\*\/\s*/, "");
  const chunks = topLevelChunks(body)
    .map(text => ({ text, names: declaredNames(text), refs: referencedNames(text) }));
  const byName = new Map();
  for (const chunk of chunks) for (const name of chunk.names) byName.set(name, chunk);
  return { chunks, byName };
})();

const TD_BRAND_BANNER = `/**
 * Brand marks, copied in from the TonalDepth package's own \`td-brands\`.
 *
 * Paths and colours are Simple Icons' (simpleicons.org). They travel inside
 * the item rather than being imported because there is nothing on npm to point
 * at — the marks are vendored in this repository, and a registry item is one
 * self-contained file. The icons are CC0; the marks stay their owners'
 * trademarks, so do not restyle one past the inversions its owner publishes.
 */
`;

/**
 * The brand marks a module pulls from `./td-brands`, as source to paste in.
 *
 * The same problem `iconImport` solves, with the opposite answer. A UI icon is
 * an alias over a Phosphor export, so that import can simply be rewritten to
 * name Phosphor — but a brand mark is path data this repository vendors, and a
 * consumer has nothing to install. The closure is by name, so an item carries
 * only the marks it actually names.
 */
function brandImport(moduleSource, body) {
  const match = moduleSource.match(/import \{([^}]*)\} from "\.\/td-brands";/s);
  if (!match) return null;
  const wanted = match[1].split(",").map(part => part.trim().replace(/^type\s+/, "")).filter(Boolean)
    .filter(name => new RegExp(`\\b${name}\\b`).test(body));
  if (!wanted.length) return null;

  const keep = new Set();
  const queue = [...wanted];
  while (queue.length) {
    const name = queue.pop();
    const chunk = TD_BRAND_CHUNKS.byName.get(name);
    if (!chunk || keep.has(chunk)) continue;
    keep.add(chunk);
    for (const ref of chunk.refs) if (TD_BRAND_CHUNKS.byName.has(ref)) queue.push(ref);
  }
  const declarations = TD_BRAND_CHUNKS.chunks.filter(chunk => keep.has(chunk))
    .map(chunk => chunk.text.replace(/^export /gm, "")).join("\n\n");
  return { inline: `${TD_BRAND_BANNER}${declarations}\n\n`, reactSpecifiers: reactImportSpecifiers(TD_BRANDS_SOURCE) };
}

function tdIconSource(roles) {
  const keep = new Set();
  const queue = roles.map(role => TD_ALIASES[role]);
  while (queue.length) {
    const name = queue.pop();
    const chunk = TD_ICON_CHUNKS.byName.get(name);
    if (!chunk || keep.has(chunk)) continue;
    keep.add(chunk);
    for (const ref of chunk.refs) if (TD_ICON_CHUNKS.byName.has(ref)) queue.push(ref);
  }
  // The glyphs are the item's private business, not part of its surface.
  const declarations = TD_ICON_CHUNKS.chunks.filter(chunk => keep.has(chunk))
    .map(chunk => chunk.text.replace(/^export /gm, "")).join("\n\n");
  const aliases = roles.map(role => `const ${role} = ${TD_ALIASES[role]};`).join("\n");
  return `${TD_ICON_BANNER}${declarations}\n\n${aliases}\n\n`;
}


/**
 * The icon set the module pulls from `./icons`, translated for a registry item.
 *
 * A registry item is one self-contained file, so it cannot carry the package's
 * `./icons` module along. The role names it uses (`AcceptIcon`, `WhatsAppIcon`)
 * are aliases over Phosphor's own exports, so the import is rewritten to name
 * Phosphor directly with the same aliases — the body needs no edit, and the
 * item declares `@phosphor-icons/react` as its one npm dependency.
 */
function iconImport(moduleSource, body) {
  const match = moduleSource.match(/import \{([^}]*)\} from "\.\/icons";/);
  if (!match) return null;
  const wanted = match[1].split(",").map(part => part.trim()).filter(Boolean)
    .filter(name => new RegExp(`\\b${name.replace(/^type\s+/, "")}\\b`).test(body));
  if (!wanted.length) return null;

  // LAMP_WEIGHT is a package constant, not a Phosphor export — inline it.
  const needsWeight = wanted.includes("LAMP_WEIGHT");
  const roles = wanted.filter(name => name !== "LAMP_WEIGHT");
  const drawnHere = roles.filter(role => role in TD_ALIASES);
  const aliased = roles.filter(role => !(role in TD_ALIASES)).map(role => {
    const real = ICON_ALIASES[role];
    if (!real) throw new Error(`icons.ts exports ${role} but generate.mjs can resolve it to neither a Phosphor export nor a TD glyph`);
    return real === role ? role : `${real} as ${role}`;
  });
  return {
    line: aliased.length ? `import { ${aliased.join(", ")} } from "@phosphor-icons/react";` : null,
    weight: needsWeight ? 'const LAMP_WEIGHT = "fill" as const;\n\n' : "",
    inline: drawnHere.length ? tdIconSource(drawnHere) : "",
    // The glyphs bring their own React types with them.
    reactSpecifiers: drawnHere.length ? reactImportSpecifiers(TD_ICONS_SOURCE) : [],
  };
}

function buildItem(itemName, spec, moduleSource) {
  const chunks = topLevelChunks(moduleBody(moduleSource)).map(text => ({ text, names: declaredNames(text), refs: referencedNames(text) }));
  const byName = new Map();
  for (const chunk of chunks) for (const name of chunk.names) byName.set(name, chunk);

  // Transitive closure from the item's exports over the module's own declarations.
  const keep = new Set();
  const queue = [...spec.symbols, ...spec.symbols.map(s => `${s}Props`)];
  while (queue.length) {
    const name = queue.pop();
    const chunk = byName.get(name);
    if (!chunk || keep.has(chunk)) continue;
    keep.add(chunk);
    for (const ref of chunk.refs) if (byName.has(ref)) queue.push(ref);
  }
  const unresolved = spec.symbols.filter(name => !byName.has(name));
  if (unresolved.length) {
    throw new Error(`${itemName}: ${unresolved.join(", ")} not found in ${spec.module}.tsx — ` +
      `either the export was renamed or a leading comment hid it from the parser.`);
  }

  const ordered = chunks.filter(chunk => keep.has(chunk));
  const kept = new Set(ordered.flatMap(chunk => chunk.names));

  // Non-exported helpers stay non-exported; everything else the item owns is
  // exported under its prefixed name.
  // Export-ness is copied from the package, which is where the public surface is
  // decided. A helper the package keeps private — RadioContext, say — stays
  // private here; a public type reached through a Props interface stays public.
  let body = ordered.map(chunk => chunk.text).join("\n\n");

  for (const name of [...kept].sort((a, b) => b.length - a.length)) {
    body = body.replace(new RegExp(`\\b${name}\\b`, "g"), prefixed(name));
  }
  body = body.replaceAll("td-react-", "td-registry-");

  /* A component built on another one imports it from its sibling registry file
     instead of carrying a second copy. The item declares the sibling in
     `registryDependencies`, so shadcn installs both. Inlining would give a
     consumer two Frames that drift apart the first time one is corrected. */
  const needed = [];
  for (const need of spec.needs ?? []) {
    for (const name of need.symbols) body = body.replace(new RegExp(`\\b${name}\\b`, "g"), prefixed(name));
    needed.push(`import { ${need.symbols.map(prefixed).join(", ")} } from "./tonaldepth-${need.item}";`);
  }

  const usesCx = /\bcx\(/.test(body);
  const cxHelper = usesCx
    ? 'function cx(...values: Array<string | false | null | undefined>): string {\n  return values.filter(Boolean).join(" ");\n}\n\n'
    : "";

  // Which icons an item needs is read from the untouched body, so the pasted
  // glyphs cannot be mistaken for the component's own use of them.
  const icons = iconImport(moduleSource, body);
  const brands = brandImport(moduleSource, body);
  const inline = `${icons?.inline ?? ""}${brands?.inline ?? ""}`;

  const used = new Set();
  for (const match of `${inline}${body}`.matchAll(/\b[A-Za-z_$][\w$]*\b/g)) used.add(match[0]);
  const fromReact = reactImportSpecifiers(moduleSource);
  const extraReact = [...(icons?.reactSpecifiers ?? []), ...(brands?.reactSpecifiers ?? [])];
  const specifiers = [...fromReact, ...extraReact.filter(name => !fromReact.includes(name))]
    .filter(specifier => used.has(specifier.replace(/^type\s+/, "")));

  const head = [];
  if (CLIENT_HOOKS.test(body)) head.push('"use client";', "");
  if (specifiers.length) head.push(`import { ${specifiers.join(", ")} } from "react";`);
  if (icons?.line) head.push(icons.line);
  head.push(`import "./tonaldepth-${itemName}.css";`);
  head.push(...needed);
  head.push("");

  return `${head.join("\n")}\n${icons?.weight ?? ""}${cxHelper}${inline}${body}\n`;
}

const stale = [];
const written = [];
for (const [itemName, spec] of Object.entries(ITEMS)) {
  const moduleSource = await readFile(resolve(PACKAGE_SRC, `${spec.module}.tsx`), "utf8");
  const generated = buildItem(itemName, spec, moduleSource);
  const target = resolve(REGISTRY_SRC, `${itemName}.tsx`);
  const current = await readFile(target, "utf8").catch(() => null);
  if (current === generated) continue;
  if (CHECK) stale.push(itemName);
  else { await writeFile(target, generated); written.push(itemName); }
}

// A package module nobody generates from is a component that never reaches the
// registry — the failure this whole script exists to prevent.
const covered = new Set(Object.values(ITEMS).map(spec => spec.module));
const modules = (await readdir(PACKAGE_SRC))
  .filter(name => name.endsWith(".tsx") && !name.includes(".test."))
  .map(name => name.replace(/\.tsx$/, ""))
  // The TD glyph set is not a component. It reaches the registry pasted into
  // whichever items use it, never as an item of its own. The brand-logo set is
  // its sibling — a generated asset module (from tooling/brands), not a
  // component, and shipped via the `./brands` package subpath rather than a
  // registry item.
  .filter(name => name !== "td-icons" && name !== "td-brands");
const orphans = modules.filter(name => !covered.has(name));
if (orphans.length) {
  console.error(`Package modules with no registry item: ${orphans.join(", ")}`);
  console.error("Add them to ITEMS in tooling/registry/generate.mjs.");
  process.exit(1);
}

if (CHECK) {
  if (stale.length) {
    console.error(`Registry is out of date: ${stale.join(", ")}`);
    console.error("Run: pnpm registry:generate");
    process.exit(1);
  }
  console.log(`Registry is up to date — ${Object.keys(ITEMS).length} items.`);
} else {
  console.log(written.length
    ? `Regenerated ${written.length} of ${Object.keys(ITEMS).length} registry items: ${written.join(", ")}`
    : `All ${Object.keys(ITEMS).length} registry items already up to date.`);
}
