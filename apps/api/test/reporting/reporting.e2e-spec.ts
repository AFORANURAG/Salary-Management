import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildSalaryStructureInput } from "../utils/salary-structure-factory";
import { createTestApp } from "../utils/test-app";
import { persistEmployee } from "../utils/persist-employee";
import { persistPayrollResult } from "../utils/persist-payroll-result";

// Unique period prefix to avoid collisions with other test files
const PERIOD = "5100-01";

describe("Reporting (e2e)", () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;

  beforeAll(async () => {
    app = await createTestApp();
    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  // ---------------------------------------------------------------------------
  // GET /v1/reporting/payroll-cost
  // ---------------------------------------------------------------------------

  describe("GET /reporting/payroll-cost", () => {
    it("returns grouped cost by department with correct headcount and totals (201)", async () => {
      const emp1 = await persistEmployee({ department: "Engineering", currency: "USD" });
      const emp2 = await persistEmployee({ department: "Engineering", currency: "USD" });
      const emp3 = await persistEmployee({ department: "Sales", currency: "USD" });

      const structRes1 = await http
        .put(`/v1/employees/${emp1.id}/salary-structure`)
        .send(buildSalaryStructureInput({ effectiveFrom: "2025-01-01", currency: "USD" }));
      const structRes2 = await http
        .put(`/v1/employees/${emp2.id}/salary-structure`)
        .send(buildSalaryStructureInput({ effectiveFrom: "2025-01-01", currency: "USD" }));
      const structRes3 = await http
        .put(`/v1/employees/${emp3.id}/salary-structure`)
        .send(buildSalaryStructureInput({ effectiveFrom: "2025-01-01", currency: "USD" }));

      await persistPayrollResult({
        employeeId: emp1.id,
        structureId: structRes1.body.id,
        period: PERIOD,
        grossMinor: 600_000,
        deductionsMinor: 60_000,
        netMinor: 540_000,
        currency: "USD",
      });
      await persistPayrollResult({
        employeeId: emp2.id,
        structureId: structRes2.body.id,
        period: PERIOD,
        grossMinor: 600_000,
        deductionsMinor: 60_000,
        netMinor: 540_000,
        currency: "USD",
      });
      await persistPayrollResult({
        employeeId: emp3.id,
        structureId: structRes3.body.id,
        period: PERIOD,
        grossMinor: 500_000,
        deductionsMinor: 50_000,
        netMinor: 450_000,
        currency: "USD",
      });

      const res = await http
        .get("/v1/reporting/payroll-cost")
        .query({ period: PERIOD, groupBy: "department" });

      expect(res.status).toBe(200);
      expect(res.body.period).toBe(PERIOD);
      expect(res.body.groupBy).toBe("department");
      expect(Array.isArray(res.body.buckets)).toBe(true);

      const usdBucket = res.body.buckets.find(
        (b: { currency: string }) => b.currency === "USD",
      );
      expect(usdBucket).toBeDefined();

      const eng = usdBucket.groups.find(
        (g: { key: string }) => g.key === "Engineering",
      );
      expect(eng).toBeDefined();
      expect(eng.headcount).toBe(2);
      expect(eng.grossMinor).toBe(1_200_000);
      expect(eng.netMinor).toBe(1_080_000);

      const sales = usdBucket.groups.find(
        (g: { key: string }) => g.key === "Sales",
      );
      expect(sales).toBeDefined();
      expect(sales.headcount).toBe(1);
      expect(sales.netMinor).toBe(450_000);
    });

    it("returns grouped cost by country", async () => {
      const res = await http
        .get("/v1/reporting/payroll-cost")
        .query({ period: PERIOD, groupBy: "country" });

      expect(res.status).toBe(200);
      expect(res.body.groupBy).toBe("country");
      expect(Array.isArray(res.body.buckets)).toBe(true);
    });

    it("returns grouped cost by costCenter, excluding employees with null costCenter", async () => {
      const empWithCC = await persistEmployee({
        costCenter: "CC-100",
        currency: "USD",
      });
      const empNoCC = await persistEmployee({ costCenter: null, currency: "USD" });

      const structResCC = await http
        .put(`/v1/employees/${empWithCC.id}/salary-structure`)
        .send(buildSalaryStructureInput({ effectiveFrom: "2025-01-01", currency: "USD" }));
      const structResNo = await http
        .put(`/v1/employees/${empNoCC.id}/salary-structure`)
        .send(buildSalaryStructureInput({ effectiveFrom: "2025-01-01", currency: "USD" }));

      const ccPeriod = "5100-02";
      await persistPayrollResult({
        employeeId: empWithCC.id,
        structureId: structResCC.body.id,
        period: ccPeriod,
        grossMinor: 600_000,
        deductionsMinor: 60_000,
        netMinor: 540_000,
        currency: "USD",
      });
      await persistPayrollResult({
        employeeId: empNoCC.id,
        structureId: structResNo.body.id,
        period: ccPeriod,
        grossMinor: 500_000,
        deductionsMinor: 50_000,
        netMinor: 450_000,
        currency: "USD",
      });

      const res = await http
        .get("/v1/reporting/payroll-cost")
        .query({ period: ccPeriod, groupBy: "costCenter" });

      expect(res.status).toBe(200);
      const allGroups = res.body.buckets.flatMap(
        (b: { groups: { key: string }[] }) => b.groups,
      );
      const keys = allGroups.map((g: { key: string }) => g.key);
      expect(keys).toContain("CC-100");
      expect(keys).not.toContain(null);
    });

    it("returns 400 when period is missing", async () => {
      const res = await http
        .get("/v1/reporting/payroll-cost")
        .query({ groupBy: "department" });
      expect(res.status).toBe(400);
    });

    it("returns 400 when groupBy is invalid", async () => {
      const res = await http
        .get("/v1/reporting/payroll-cost")
        .query({ period: PERIOD, groupBy: "invalid" });
      expect(res.status).toBe(400);
    });

    it("returns empty buckets when no results exist for the period", async () => {
      const res = await http
        .get("/v1/reporting/payroll-cost")
        .query({ period: "5999-12", groupBy: "department" });

      expect(res.status).toBe(200);
      expect(res.body.buckets).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /v1/reporting/payroll-summary
  // ---------------------------------------------------------------------------

  describe("GET /reporting/payroll-summary", () => {
    it("returns correct org-wide totals per currency for a period", async () => {
      const res = await http
        .get("/v1/reporting/payroll-summary")
        .query({ period: PERIOD });

      expect(res.status).toBe(200);
      expect(res.body.period).toBe(PERIOD);
      expect(Array.isArray(res.body.buckets)).toBe(true);

      const usdBucket = res.body.buckets.find(
        (b: { currency: string }) => b.currency === "USD",
      );
      expect(usdBucket).toBeDefined();
      expect(typeof usdBucket.grossMinor).toBe("number");
      expect(typeof usdBucket.deductionsMinor).toBe("number");
      expect(typeof usdBucket.netMinor).toBe("number");
      expect(typeof usdBucket.headcount).toBe("number");
      expect(usdBucket.headcount).toBeGreaterThanOrEqual(3);
    });

    it("produces separate buckets for mixed-currency periods — no cross-currency sum", async () => {
      const empUSD = await persistEmployee({ currency: "USD" });
      const empINR = await persistEmployee({ currency: "INR" });

      const sUSD = await http
        .put(`/v1/employees/${empUSD.id}/salary-structure`)
        .send(buildSalaryStructureInput({ effectiveFrom: "2025-01-01", currency: "USD" }));
      const sINR = await http
        .put(`/v1/employees/${empINR.id}/salary-structure`)
        .send(
          buildSalaryStructureInput({
            effectiveFrom: "2025-01-01",
            currency: "INR",
            components: [{ code: "BASIC", kind: "EARNING", amountMinor: 5_000_000 }],
          }),
        );

      const mixPeriod = "5100-03";
      await persistPayrollResult({
        employeeId: empUSD.id,
        structureId: sUSD.body.id,
        period: mixPeriod,
        grossMinor: 600_000,
        deductionsMinor: 60_000,
        netMinor: 540_000,
        currency: "USD",
      });
      await persistPayrollResult({
        employeeId: empINR.id,
        structureId: sINR.body.id,
        period: mixPeriod,
        grossMinor: 5_000_000,
        deductionsMinor: 0,
        netMinor: 5_000_000,
        currency: "INR",
      });

      const res = await http
        .get("/v1/reporting/payroll-summary")
        .query({ period: mixPeriod });

      expect(res.status).toBe(200);
      expect(res.body.buckets.length).toBeGreaterThanOrEqual(2);
      const usd = res.body.buckets.find((b: { currency: string }) => b.currency === "USD");
      const inr = res.body.buckets.find((b: { currency: string }) => b.currency === "INR");
      expect(usd).toBeDefined();
      expect(inr).toBeDefined();
      // INR gross must not bleed into USD bucket
      expect(usd.grossMinor).toBeLessThan(5_000_000);
    });

    it("returns 400 when period is missing", async () => {
      const res = await http.get("/v1/reporting/payroll-summary");
      expect(res.status).toBe(400);
    });

    it("returns empty buckets when no results exist for the period", async () => {
      const res = await http
        .get("/v1/reporting/payroll-summary")
        .query({ period: "5998-12" });

      expect(res.status).toBe(200);
      expect(res.body.buckets).toEqual([]);
    });
  });
});
