import { beforeAll, afterEach, afterAll } from "vitest";
import { server } from "./server";

export function setupMswServer() {
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
}
