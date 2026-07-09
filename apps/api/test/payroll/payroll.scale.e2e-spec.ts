import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestApp, loginAsAdmin } from "../utils/test-app";
import { persistPayrollSeed } from "../utils/persist-payroll-seed";

const SCALE = 10_000;
const BUDGET_MS = 30_000;

describe("Payroll at scale (e2e)", () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let authCookie: string[];

  beforeAll(async () => {
    app = await createTestApp();
    http = request(app.getHttpServer());
  }, 30_000);

  // Global beforeEach truncates; re-seed here so the test starts clean but populated.
  beforeEach(async () => {
    authCookie = await loginAsAdmin(app);
    await persistPayrollSeed(SCALE, "2024-01-01");
  }, 180_000);

  afterAll(async () => {
    await app.close();
  });

  it(
    `processes ${SCALE} employees in < ${BUDGET_MS / 1000}s`,
    async () => {
      const start = performance.now();
      const res = await http.post("/v1/payroll/runs").set("Cookie", authCookie).send({ period: "2026-01" });
      const elapsed = performance.now() - start;

      expect(res.status).toBe(201);
      expect(res.body.headcount).toBe(SCALE);
      expect(res.body.status).toBe("COMPLETED");
      expect(elapsed).toBeLessThan(BUDGET_MS);
    },
    60_000,
  );
});
