# `@mithtech-bengaluru/tonaldepth-react`

Typed React adapters for the TonalDepth core package. They preserve the approved `.td-*` classes, `--td-*` variables, themes, density settings, and offline-HTML visual baseline.

```tsx
import { Alert, Button, Checkbox, Dialog, Tabs } from "@mithtech-bengaluru/tonaldepth-react";
import "@mithtech-bengaluru/tonaldepth-react/styles.css";
```

P0 exports: Button, Badge, Card composition, Input, Textarea, and FormField.

P1 exports: Checkbox, RadioGroup/Radio, Switch, Alert, Tooltip, Dialog, DropdownMenu, Tabs, Table primitives, ToastProvider, and useToast.

P2 exports: KpiCard/KpiGrid, FilterBar, DesktopNavigation, ApplicationShell, and ChartContainer.

P3 exports: DashboardPage, DashboardPanel, DataManagementPage, and PageState.

Components forward appropriate native DOM attributes and refs. Interactive P1 components provide keyboard behavior and accessible names/relationships. See `specification/components/react-p1.md` for supported contracts and boundaries.

This prerelease is verified locally from packed artifacts in clean Vite and Next consumers. It has not been published to GitHub Packages.
