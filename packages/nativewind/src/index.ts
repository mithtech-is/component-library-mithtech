export { tonalDepthColors, tonalDepthRadii, tonalDepthSpacing, type TonalDepthThemeMode } from "./tokens";
import { tonalDepthColors, tonalDepthRadii, tonalDepthSpacing } from "./tokens";
export const tonalDepthNativeWindTheme = {
  colors: {
    td: tonalDepthColors.light,
    "td-dark": tonalDepthColors.dark,
  },
  spacing: Object.fromEntries(Object.entries(tonalDepthSpacing).map(([key, value]) => [`td-${key}`, value])),
  borderRadius: Object.fromEntries(Object.entries(tonalDepthRadii).map(([key, value]) => [`td-${key}`, value])),
} as const;
