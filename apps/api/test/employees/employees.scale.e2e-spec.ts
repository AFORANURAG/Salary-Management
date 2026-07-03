import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { persistEmployees } from "../utils/persist-employee";
import { createTestApp } from "../utils/test-app";

const SCALE = 10_000;

describe("Employees list at scale (e2e)", () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;

  beforeAll(async () => {
    app = await createTestApp();
    http = request(app.getHttpServer());
  }, 30_000);

  // The global beforeEach truncates the DB; this local beforeEach re-seeds
  // after truncation so each test starts with a full 10k dataset.
  beforeEach(async () => {
    await persistEmployees(SCALE, (i) => ({
      name: i % 2 === 0 ? `ScaleUser ${i}` : `Other ${i}`,
      department: i % 3 === 0 ? "Engineering" : "Sales",
      country: i % 2 === 0 ? "US" : "IN",
    }));
  }, 120_000);

  afterAll(async () => {
    await app.close();
  });

  it(
    "search, filter+search, and p95 < 300ms over 10k rows",
    async () => {
      // (1) paginated search returns correct total
      const searchRes = await http
        .get("/v1/employees")
        .query({ q: "ScaleUser", page: 1, pageSize: 25 });
      expect(searchRes.status).toBe(200);
      expect(searchRes.body.total).toBe(SCALE / 2);
      expect(searchRes.body.data).toHaveLength(25);

      // (2) filters + search compose correctly
      const filterRes = await http
        .get("/v1/employees")
        .query({ q: "ScaleUser", department: "Engineering", country: "US" });
      expect(filterRes.status).toBe(200);
      expect(filterRes.body.total).toBeGreaterThan(0);

      // (3) p95 < 300ms over 20 paginated requests
      const samples: number[] = [];
      for (let n = 0; n < 20; n += 1) {
        const start = performance.now();
        await http.get("/v1/employees").query({ page: n + 1, pageSize: 25, sort: "name:asc" });
        samples.push(performance.now() - start);
      }
      samples.sort((a, b) => a - b);
      const p95 = samples[Math.floor(samples.length * 0.95) - 1];
      expect(p95).toBeLessThan(300);
    },
    120_000,
  );
});
