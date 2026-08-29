import type { ClassValue } from "./vue-types";
export function cx(...values: ClassValue[]): string {
  return values.flatMap(value => Array.isArray(value) ? value : [value]).filter(Boolean).join(" ");
}
