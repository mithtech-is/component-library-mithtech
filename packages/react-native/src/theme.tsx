import { createContext, useContext, type ReactNode } from "react";
import { tonalDepthColors, tonalDepthRadii, tonalDepthSpacing, type TonalDepthThemeMode } from "@mithtech-bengaluru/tonaldepth-nativewind";
export interface TonalDepthNativeTheme { mode: TonalDepthThemeMode; colors: typeof tonalDepthColors.light | typeof tonalDepthColors.dark; spacing: typeof tonalDepthSpacing; radii: typeof tonalDepthRadii }
export function createTonalDepthNativeTheme(mode: TonalDepthThemeMode): TonalDepthNativeTheme { return { mode, colors: tonalDepthColors[mode], spacing: tonalDepthSpacing, radii: tonalDepthRadii }; }
const ThemeContext = createContext<TonalDepthNativeTheme>(createTonalDepthNativeTheme("light"));
export function TonalDepthProvider({ mode = "light", children }: { mode?: TonalDepthThemeMode; children: ReactNode }) { return <ThemeContext.Provider value={createTonalDepthNativeTheme(mode)}>{children}</ThemeContext.Provider>; }
export function useTonalDepthTheme() { return useContext(ThemeContext); }
