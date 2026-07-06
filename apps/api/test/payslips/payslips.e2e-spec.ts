import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { buildSalaryStructureInput } from "../utils/salary-structure-factory";
import { createTestApp, loginAsAdmin } from "../utils/test-app";
import { persistEmployee } from "../utils/persist-employee";
import { persistPayrollResult } from "../utils/persist-payroll-result";

describe("Payslips (e2e)", () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let authCookie: string[];

  beforeAll(async () => {
    app = await createTestApp();
    http = request(app.getHttpServer());
  });

  beforeEach(async () => {
    authCookie = await loginAsAdmin(app);
  });

  afterAll(async () => {
    await app.close();
  });

  // ---------------------------------------------------------------------------
  // GET /v1/employees/:id/payslips
  // ---------------------------------------------------------------------------

  describe("GET /v1/employees/:id/payslips", () => {
    it("returns history newest-first for an employee with multiple runs", async () => {
      const emp = await persistEmployee();
      const structRes = await http
        .put(`/v1/employees/${emp.id}/salary-structure`)
        .set("Cookie", authCookie)
        .send(buildSalaryStructureInput({ effectiveFrom: "2025-01-01" }));
      const structureId = structRes.body.id as string;

      await persistPayrollResult({
        employeeId: emp.id,
        structureId,
        period: "2025-01",
        grossMinor: 600_000,
        deductionsMinor: 60_000,
        netMinor: 540_000,
        currency: "USD",
      });
      await persistPayrollResult({
        employeeId: emp.id,
        structureId,
        period: "2025-02",
        grossMinor: 600_000,
        deductionsMinor: 60_000,
        netMinor: 540_000,
        currency: "USD",
      });

      const res = await http.get(`/v1/employees/${emp.id}/payslips`).set("Cookie", authCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].period).toBe("2025-02");
      expect(res.body[1].period).toBe("2025-01");
      expect(res.body[0]).toMatchObject({
        grossMinor: 600_000,
        deductionsMinor: 60_000,
        netMinor: 540_000,
        currency: "USD",
      });
    });

    it("returns an empty array when the employee has no payroll results", async () => {
      const emp = await persistEmployee();

      const res = await http.get(`/v1/employees/${emp.id}/payslips`).set("Cookie", authCookie);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("returns 404 for an unknown employee id", async () => {
      const res = await http.get(
        "/v1/employees/00000000-0000-0000-0000-000000000000/payslips",
      ).set("Cookie", authCookie);

      expect(res.status).toBe(404);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /v1/employees/:id/payslips/:period
  // ---------------------------------------------------------------------------

  describe("GET /v1/employees/:id/payslips/:period", () => {
    it("returns full payslip with employee identity and line items", async () => {
      const emp = await persistEmployee({ currency: "USD" });
      const structRes = await http
        .put(`/v1/employees/${emp.id}/salary-structure`)
        .set("Cookie", authCookie)
        .send(buildSalaryStructureInput({ effectiveFrom: "2025-01-01" }));
      const structureId = structRes.body.id as string;

      await persistPayrollResult({
        employeeId: emp.id,
        structureId,
        period: "2025-06",
        grossMinor: 600_000,
        deductionsMinor: 60_000,
        netMinor: 540_000,
        currency: "USD",
      });

      const res = await http.get(`/v1/employees/${emp.id}/payslips/2025-06`).set("Cookie", authCookie);

      expect(res.status).toBe(200);
      expect(res.body.period).toBe("2025-06");
      expect(res.body.employeeId).toBe(emp.id);
      expect(res.body.employeeCode).toBe(emp.employeeCode);
      expect(res.body.name).toBe(emp.name);
      expect(res.body.currency).toBe("USD");
      expect(res.body.grossMinor).toBe(600_000);
      expect(res.body.deductionsMinor).toBe(60_000);
      expect(res.body.netMinor).toBe(540_000);
      expect(Array.isArray(res.body.lineItems)).toBe(true);
      expect(res.body.lineItems).toHaveLength(3);
      const codes = res.body.lineItems.map((l: { code: string }) => l.code).sort();
      expect(codes).toEqual(["BASIC", "HRA", "PF"]);
    });

    it("returns 404 for an unknown employee id", async () => {
      const res = await http.get(
        "/v1/employees/00000000-0000-0000-0000-000000000000/payslips/2025-06",
      ).set("Cookie", authCookie);

      expect(res.status).toBe(404);
    });

    it("returns 404 when the employee exists but has no result for that period", async () => {
      const emp = await persistEmployee();

      const res = await http.get(`/v1/employees/${emp.id}/payslips/2099-01`).set("Cookie", authCookie);

      expect(res.status).toBe(404);
    });
  });
});
