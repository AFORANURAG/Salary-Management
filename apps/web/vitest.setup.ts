import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { beforeAll, afterEach, afterAll } from "vitest";
import { server } from "./test/msw/server";


beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterAll(() => server.close());

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

// Radix UI primitives (Select, DropdownMenu, etc.) use pointer events
// which jsdom doesn't fully implement.
if (typeof window !== "undefined") {
  window.HTMLElement.prototype.hasPointerCapture = () => false;
  window.HTMLElement.prototype.setPointerCapture = () => {};
  window.HTMLElement.prototype.releasePointerCapture = () => {};
  window.HTMLElement.prototype.scrollIntoView = () => {};
}

// DEBUG: check AbortController at setup time
console.log("[SETUP TOP-LEVEL] AbortController native?", (AbortController as unknown as {toString(): string}).toString().includes('[native code]'));
console.log("[SETUP TOP-LEVEL] type:", typeof AbortController);
