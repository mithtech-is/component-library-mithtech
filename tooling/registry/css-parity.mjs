/**
 * Check that no component rule exists in the package distribution and not in
 * the registry one.
 *
 * The two stylesheets are deliberately different documents: the registry's is
 * self-contained and re-declares the `.td-*` base layer a package consumer
 * inherits from `@mithtech-bengaluru/tonaldepth-core`. So the registry having
 * MORE rules is correct and expected. The failure mode is the other direction —
 * a rule added to `packages/react/src/x.css` and never carried across, which is
 * how six stylesheets and the Frame nesting rule ([[L32]]) drifted apart before
 * anything noticed.
 *
 *   node tooling/registry/css-parity.mjs
 *
 * Exits non-zero when the package styles a part or a state the registry does not.
 *
 * ## Why the comparison needs normalising
 *
 * Three differences are structural rather than drift, and comparing raw
 * selectors reports all three as failures:
 *
 * 1. **The prefix.** A copied-in file must not collide with an installed
 *    package, so the package writes `.td-react-frame` and the registry
 *    `.td-registry-frame`. Both fold to `.td-X-frame`.
 * 2. **Specificity compounding.** The package rides the base layer it inherits,
 *    so it doubles up — `.td-alert.td-react-alert` — to win against a `.td-alert`
 *    it does not own. The registry owns its base layer outright and has nothing
 *    to out-rank. Within one compound only the most specific own-class survives.
 * 3. **The file split.** One package module can be several registry items:
 *    `selection.css` is `checkbox` + `radio` + `switch`. The mapping comes from
 *    the generator's own ITEMS table so the two files cannot disagree about it.
 */

import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const PACKAGE_SRC = resolve(ROOT, "packages/react/src");
const REGISTRY_SRC = resolve(ROOT, "registry/tonaldepth");

/** Which registry stylesheets a package module's rules may have landed in. */
async function moduleToItems() {
  const generator = await readFile(resolve(import.meta.dirname, "generate.mjs"), "utf8");
  const table = generator.slice(generator.indexOf("const ITEMS = {"), generator.indexOf("\n};", generator.indexOf("const ITEMS = {")));
  const map = new Map();
  for (const [, item, module] of table.matchAll(/"([\w-]+)":\s*\{\s*module:\s*"([\w-]+)"/g)) {
    if (!map.has(module)) map.set(module, []);
    map.get(module).push(item);
  }
  return map;
}

/** Every selector a stylesheet opens a rule with, unnormalised. */
function rawSelectors(css) {
  return collect(css, one => one);
}

/** Strip comments, then take every selector opening a rule at depth 0 or 1. */
function selectors(css) {
  return collect(css, one => normalise(one));
}

function collect(css, map) {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const found = new Set();
  let depth = 0, head = "";
  for (const ch of stripped) {
    if (ch === "{") {
      const text = head.trim();
      if (text && !text.startsWith("@")) for (const one of splitSelectorList(text)) found.add(map(one));
      depth++;
      head = "";
    } else if (ch === "}") {
      depth = Math.max(0, depth - 1);
      head = "";
    } else if (depth <= 1) {
      head += ch;
    }
  }
  return found;
}

/** Split on commas at paren depth 0 — `:is(a, b)` is one selector, not two. */
function splitSelectorList(text) {
  const parts = [];
  let depth = 0, current = "";
  for (const ch of text) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === "," && depth === 0) { parts.push(current); current = ""; continue; }
    current += ch;
  }
  parts.push(current);
  return parts.map(p => p.trim()).filter(Boolean);
}

/**
 * Fold a selector to the part both distributions must agree on: which own
 * component parts it targets, in what nesting, in which state.
 *
 * Functional pseudo-classes keep their arguments, because `:not(.td-X-button--ghost)`
 * and `:not(.td-X-button--link)` are different rules and collapsing both to
 * `:not()` would make a missing one invisible.
 */
function normalise(selector, keepOwn = true) {
  return selector
    .replace(/td-(react|registry)-/g, "td-X-")
    .trim()
    .split(/\s+(?![^(]*\))/)
    .map(compound => foldCompound(compound, keepOwn))
    .join(" ");
}

/**
 * The forms a registry stylesheet may legitimately carry a package rule in.
 *
 * When the package compounds a base class with its own — `.td-iconbtn.td-react-theme-toggle`
 * — it is overriding a rule it does not own, because the base layer arrives from
 * `tonaldepth-core`. The registry owns its base layer outright, so it writes the
 * same declaration on the bare `.td-iconbtn` and needs no override. Both are the
 * rule being present.
 */
function acceptableForms(selector) {
  const forms = new Set([normalise(selector, true)]);
  if (/\.td-[\w-]+\.td-(react|registry)-/.test(selector)) {
    // `.td-react-iconbutton.td-glowicon.td-glowicon--text` reaches the registry
    // as the base rule `.td-glowicon--text`, so the base half folds by the same
    // longest-wins rule the own half does.
    forms.add(normalise(selector, false));
    forms.add(normalise(selector, false).replace(/(?:\.td-[\w-]+)+/g, m =>
      (m.match(/\.td-[\w-]+/g) ?? []).sort((a, b) => b.length - a.length)[0]));
  }
  return forms;
}

/**
 * `.td-alert.td-X-alert-close:hover` -> `.td-X-alert-close:hover`.
 *
 * Keeps every pseudo-class, pseudo-element and attribute test in place, and of
 * the plain classes keeps only the most specific own one — the rest are the
 * base classes the package compounds against and the registry owns outright.
 */
function foldCompound(compound, keepOwn) {
  // The element alternative is last and non-empty on purpose: an alternative
  // that can match the empty string matches it at index 0, and `String.match`
  // then steps past the character it was standing on — silently dropping the
  // leading `.td-iconbtn` from every compound that has one.
  const parts = compound.match(/\.[\w-]+|:{1,2}[\w-]+(?:\((?:[^()]|\([^()]*\))*\))?|\[[^\]]*\]|^[a-zA-Z*]+/g) ?? [];
  const classes = parts.filter(part => part.startsWith("."));
  const own = classes.filter(part => part.startsWith(".td-X-")).sort((a, b) => b.length - a.length);
  if (!own.length) return compound;
  if (!keepOwn && classes.length > own.length) {
    const drop = new Set(own);
    return parts.filter(part => !drop.has(part)).join("");
  }
  const keep = new Set([own[0]]);
  return parts.filter(part => !part.startsWith(".") || keep.has(part)).join("");
}

const items = await moduleToItems();
const packageFiles = (await readdir(PACKAGE_SRC)).filter(n => n.endsWith(".css") && n !== "styles.css");
const registryFiles = new Set((await readdir(REGISTRY_SRC)).filter(n => n.endsWith(".css")));

const problems = [];
for (const name of packageFiles.sort()) {
  const module = name.replace(/\.css$/, "");
  const targets = (items.get(module) ?? [module]).map(item => `${item}.css`).filter(f => registryFiles.has(f));
  if (!targets.length) {
    problems.push(`${name}: no registry stylesheet carries this module`);
    continue;
  }
  const covered = new Set();
  for (const target of targets) {
    for (const one of selectors(await readFile(resolve(REGISTRY_SRC, target), "utf8"))) covered.add(one);
  }
  const raw = rawSelectors(await readFile(resolve(PACKAGE_SRC, name), "utf8"));
  for (const one of raw) {
    if (![...acceptableForms(one)].some(form => covered.has(form))) {
      problems.push(`${name} -> ${targets.join(", ")}: missing  ${normalise(one)}`);
    }
  }
}

if (problems.length) {
  console.error(`Registry CSS is behind the package on ${problems.length} rule(s):\n`);
  for (const line of problems) console.error(`  ${line}`);
  console.error("\nBoth distributions or neither. Carry the rule across, keeping the td-registry- prefix.");
  process.exit(1);
}
console.log(`Registry CSS parity: ${packageFiles.length} stylesheets, no package rule missing downstream.`);
