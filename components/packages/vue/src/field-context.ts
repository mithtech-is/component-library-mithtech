import type { ComputedRef, InjectionKey } from "vue";
export interface FieldContext {
  id: string;
  messageId: string;
  required: ComputedRef<boolean>;
  invalid: ComputedRef<boolean>;
  hasMessage: ComputedRef<boolean>;
}
export const fieldContextKey: InjectionKey<FieldContext> = Symbol("TonalDepthField");
