import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { persistEmployees } from "../utils/persist-employee";
import { createTestApp } from "../utils/test-app";

const SCALE = 10_000;

// Enabled in ET10 once the ET9 seed / batch insert path is in place.
// Kept skipped so it does not slow the standard RED/GREEN loop.
describe.skip("Employees list at scale (e2e)", () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;

  beforeAll(async () => {
    app = await createTestApp();
    http = request(app.getHttpServer());
    await persistEmployees(SCALE, (i) => ({
      name: i % 2 === 0 ? `ScaleUser ${i}` : `Other ${i}`,
      department: i % 3 === 0 ? "Engineering" : "Sales",
      country: i % 2 === 0 ? "US" : "IN",
    }));
  }, 120_000);

  afterAll(async () => {
    await app.close();
  });

  it("returns correct, stable, paginated search results over 10k rows", async () => {
    const res = await http.get("/employees").query({ q: "ScaleUser", page: 1, pageSize: 25 });
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(SCALE / 2);
    expect(res.body.data).toHaveLength(25);
  });

  it("composes filters + search correctly at scale", async () => {
    const res = await http
      .get("/employees")
      .query({ q: "ScaleUser", department: "Engineering", country: "US" });
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThan(0);
  });

  it("keeps list p95 under 300ms locally on indexed queries", async () => {
    const samples: number[] = [];
    for (let n = 0; n < 20; n += 1) {
      const start = performance.now();
      await http.get("/employees").query({ page: n + 1, pageSize: 25, sort: "name:asc" });
      samples.push(performance.now() - start);
    }
    samples.sort((a, b) => a - b);
    const p95 = samples[Math.floor(samples.length * 0.95) - 1];
    expect(p95).toBeLessThan(300);
  });
});
