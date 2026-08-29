# Component inventory

## 1. Inventory status

This is the pre-extraction inventory. It combines observed dashboard markup, inspected Storybook categories, and required platform primitives. Final counts and source mappings are generated during Phase 0.

## 2. Evidence summary

- Supplied HTML: 121 unique token names and approximately 1,413 unique `.td-*` selectors.
- Observed HTML patterns include page head, KPI grid/cards, frames, wells, panel headers, badges, pills, tables, action rows, engagement cards, closer panels, rating, filter bar, rich list rows, and theme controls.
- Storybook exposes foundations plus 32 component/pattern groups, including buttons, content blocks, selection controls, feedback, cards, forms, navigation, data, overlays, loading, interactive, analytics, dashboards, and application shells.

## 3. Classification rules

| Classification | Meaning |
|---|---|
| Primitive | Small reusable component with independent contract |
| Composite | Reusable assembly of primitives |
| Pattern | Larger workflow/layout with application slots |
| Template | Page or application example |
| Utility | Styling/layout behavior, not a component |
| Internal part | Exported only through parent component, if at all |
| Legacy candidate | Existing API preserved temporarily pending review |

## 4. Proposed universal component set

| Component | Class | Web v1 | RN | Flutter | iOS | Android |
|---|---|---:|---:|---:|---:|---:|
| Button | Primitive | Yes | Yes | Yes | Yes | Yes |
| IconButton | Primitive | Yes | Yes | Yes | Yes | Yes |
| Link/action link | Primitive | Yes | Adapt | Adapt | Adapt | Adapt |
| Text/typography | Primitive | Yes | Yes | Yes | Yes | Yes |
| Icon | Primitive | Yes | Yes | Yes | Yes | Yes |
| Badge | Primitive | Yes | Yes | Yes | Yes | Yes |
| Pill/status | Primitive | Yes | Yes | Yes | Yes | Yes |
| Divider | Primitive | Yes | Yes | Yes | Yes | Yes |
| Card/surface | Primitive | Yes | Yes | Yes | Yes | Yes |
| Input | Primitive | Yes | Yes | Yes | Yes | Yes |
| Textarea/multiline | Primitive | Yes | Yes | Yes | Yes | Yes |
| Checkbox | Primitive | Yes | Yes | Yes | Yes | Yes |
| Radio group | Primitive | Yes | Yes | Yes | Yes | Yes |
| Switch | Primitive | Yes | Yes | Yes | Yes | Yes |
| Progress | Primitive | Yes | Yes | Yes | Yes | Yes |
| Skeleton | Primitive | Yes | Yes | Yes | Yes | Yes |
| Alert | Composite | Yes | Yes | Yes | Yes | Yes |
| Form field | Composite | Yes | Yes | Yes | Yes | Yes |
| KPI card | Composite | Yes | Yes | Yes | Yes | Yes |

## 5. Web-first components

```text
Select and combobox
Dropdown menu
Popover
Tooltip
Dialog
Sheet/drawer
Tabs
Toast
Table and data table
Pagination
Breadcrumb
Desktop navigation
Command palette
Application shell
Chart container
Filter bar
Rich list row
```

Native equivalents shall use native conventions rather than forced DOM parity.

## 6. Mobile-first components

```text
App bar
Bottom navigation
Bottom sheet
Safe-area layout
Swipe action
Pull to refresh
Keyboard-avoiding form
Native picker
Native date/time picker
```

## 7. Patterns and templates

```text
Dashboard shell
Operations dashboard
Analytics dashboard
Authentication flow
Settings flow
Search/filter workflow
Data-management screen
Empty/error/loading states
Application navigation patterns
```

Patterns must not become hard dependencies of primitive packages.

## 8. Inventory record schema

The extraction inventory shall record:

```text
ID
Name
Aliases/classes
Classification
Source location
Observed markup
Variants
States
Dependencies
Accessibility status
Responsive status
Platform targets
Migration priority
Duplicate/conflict notes
Decision status
```

## 9. Version-one web priorities

P0 foundation: tokens, themes, typography, icons, Button, Badge, Card, Input, FormField.  
P1 application primitives: selection controls, Alert, Tooltip, Dialog, Dropdown, Tabs, Table, Toast.  
P2 composites: KPI, filters, navigation, application shell, charts.  
P3 patterns: dashboards and page templates.

No component is marked implemented until its production source, story/catalog, tests, and packed-consumer smoke test exist.

