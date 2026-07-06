import type { INestApplication } from "@nestjs/common";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestApp, loginAsAdmin } from "../utils/test-app";
import { TestDataSource } from "../utils/test-data-source";

describe("employees test harness", () => {
  let app: INestApplication;
  let authCookie: string[];

  beforeAll(async () => {
    app = await createTestApp();
    authCookie = await loginAsAdmin(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it("boots the Nest app against the test database", () => {
    expect(app).toBeDefined();
  });

  it("starts each test with an empty employees table", async () => {
    const rows = await TestDataSource.query('SELECT COUNT(*)::int AS count FROM "employees"');
    expect(rows[0].count).toBe(0);
  });
});
