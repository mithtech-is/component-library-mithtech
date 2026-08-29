import { describe, expect, it } from "vitest";
import { createTonalDepthNativeTheme } from "./theme";
describe("native theme",()=>{it("maps canonical modes and dimensions",()=>{const light=createTonalDepthNativeTheme("light");const dark=createTonalDepthNativeTheme("dark");expect(light.colors.brand).toBe("#FF5E29");expect(dark.colors.bg).toBe("#1A1815");expect(light.spacing["8"]).toBe(16);expect(light.radii["6"]).toBe(14);});});
