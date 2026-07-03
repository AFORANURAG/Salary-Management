import { builtinEnvironments } from "vitest/environments";

// Custom jsdom environment that preserves Node's native AbortController/AbortSignal.
// jsdom replaces these globals with its own implementations, which are incompatible
// with Node's native fetch (and therefore with MSW's fetch interceptor). By
// capturing the native classes before jsdom runs and restoring them afterwards,
// the API client's AbortController-based timeout mechanism works with MSW in tests.
const jsdom = builtinEnvironments.jsdom;

export default {
  name: "jsdom-patched",
  transformMode: "web" as const,
  async setup(global: typeof globalThis, options: Record<string, unknown>) {
    const nativeAbortController = global.AbortController;
    const nativeAbortSignal = global.AbortSignal;

    const result = await jsdom.setup(global, options);

    // Restore native AbortController/AbortSignal so they pass instanceof checks
    // in Node's native fetch (used by MSW interceptors).
    global.AbortController = nativeAbortController;
    global.AbortSignal = nativeAbortSignal;

    return result;
  },
};
