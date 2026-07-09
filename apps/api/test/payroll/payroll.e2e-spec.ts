import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { persistEmployee } from "../utils/persist-employee";
import { buildSalaryStructureInput } from "../utils/salary-structure-factory";
import { createTestApp, loginAsAdmin } from "../utils/test-app";

describe("Payroll (e2e)", () => {
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
  // POST /v1/payroll/runs
  // ---------------------------------------------------------------------------

  describe("POST /payroll/runs", () => {
    it("creates one PayrollResult per eligible employee (201)", async () => {
      const emp1 = await persistEmployee();
      const emp2 = await persistEmployee();
      await http
        .put(`/v1/employees/${emp1.id}/salary-structure`)
        .set("Cookie", authCookie)
        .send(buildSalaryStructureInput({ effectiveFrom: "2026-01-01" }));
      await http
        .put(`/v1/employees/${emp2.id}/salary-structure`)
        .set("Cookie", authCookie)
        .send(buildSalaryStructureInput({ effectiveFrom: "2026-01-01" }));

      const res = await http.post("/v1/payroll/runs").set("Cookie", authCookie).send({ period: "2026-06" });

      expect(res.status).toBe(201);
      expect(res.body.period).toBe("2026-06");
      expect(res.body.headcount).toBeGreaterThanOrEqual(2);
    });

    it("returns 409 when the same period is run a second time", async () => {
      const emp = await persistEmployee();
      await http
        .put(`/v1/employees/${emp.id}/salary-structure`)
        .set("Cookie", authCookie)
        .send(buildSalaryStructureInput({ effectiveFrom: "2025-01-01" }));

      await http.post("/v1/payroll/runs").set("Cookie", authCookie).send({ period: "2025-06" });
      const res = await http.post("/v1/payroll/runs").set("Cookie", authCookie).send({ period: "2025-06" });

      expect(res.status).toBe(409);
    });

    it("second run does not create duplicate PayrollResult rows", async () => {
      const emp = await persistEmployee();
      await http
        .put(`/v1/employees/${emp.id}/salary-structure`)
        .set("Cookie", authCookie)
        .send(buildSalaryStructureInput({ effectiveFrom: "2024-01-01" }));

      await http.post("/v1/payroll/runs").set("Cookie", authCookie).send({ period: "2024-08" });
      await http.post("/v1/payroll/runs").set("Cookie", authCookie).send({ period: "2024-08" }).ok(() => true);

      const res = await http.get("/v1/payroll/runs/2024-08/results").set("Cookie", authCookie).query({ employeeId: emp.id });
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it("gross, deductions, and net exactly match the structure components", async () => {
      const emp = await persistEmployee();
      await http
        .put(`/v1/employees/${emp.id}/salary-structure`)
        .set("Cookie", authCookie)
        .send({
          effectiveFrom: "2026-01-01",
          currency: "USD",
          components: [
            { code: "BASIC", kind: "EARNING", amountMinor: 500_000 },
            { code: "HRA", kind: "EARNING", amountMinor: 100_000 },
            { code: "PF", kind: "DEDUCTION", amountMinor: 60_000 },
          ],
        });

      const runRes = await http.post("/v1/payroll/runs").set("Cookie", authCookie).send({ period: "2026-07" });
      expect(runRes.status).toBe(201);

      const res = await http
        .get("/v1/payroll/runs/2026-07/results")
        .set("Cookie", authCookie)
        .query({ employeeId: emp.id });
      expect(res.status).toBe(200);
      const result = res.body[0];
      expect(result.grossMinor).toBe(600_000);
      expect(result.deductionsMinor).toBe(60_000);
      expect(result.netMinor).toBe(540_000);
    });

    it("uses the structure version active for the period, not the latest", async () => {
      const emp = await persistEmployee();
      // Version 1: active Jan–Jun 2025
      await http.put(`/v1/employees/${emp.id}/salary-structure`).set("Cookie", authCookie).send({
        effectiveFrom: "2025-01-01",
        currency: "USD",
        components: [{ code: "BASIC", kind: "EARNING", amountMinor: 300_000 }],
      });
      // Version 2: active from Jul 2025
      await http.put(`/v1/employees/${emp.id}/salary-structure`).set("Cookie", authCookie).send({
        effectiveFrom: "2025-07-01",
        currency: "USD",
        components: [{ code: "BASIC", kind: "EARNING", amountMinor: 400_000 }],
      });

      // Run payroll for March 2025 — should use version 1 (300k)
      const runRes = await http.post("/v1/payroll/runs").set("Cookie", authCookie).send({ period: "2025-03" });
      expect(runRes.status).toBe(201);

      const res = await http
        .get("/v1/payroll/runs/2025-03/results")
        .set("Cookie", authCookie)
        .query({ employeeId: emp.id });
      expect(res.body[0].grossMinor).toBe(300_000);
    });

    it("structureId on the result references the exact version used", async () => {
      const emp = await persistEmployee();
      const putRes = await http
        .put(`/v1/employees/${emp.id}/salary-structure`)
        .set("Cookie", authCookie)
        .send(buildSalaryStructureInput({ effectiveFrom: "2026-01-01" }));
      const structureId = putRes.body.id;

      await http.post("/v1/payroll/runs").set("Cookie", authCookie).send({ period: "2026-08" });

      const res = await http
        .get("/v1/payroll/runs/2026-08/results")
        .set("Cookie", authCookie)
        .query({ employeeId: emp.id });
      expect(res.body[0].structureId).toBe(structureId);
    });

    it("skips employees with no active structure and reports them", async () => {
      const withStructure = await persistEmployee();
      const withoutStructure = await persistEmployee();
      await http
        .put(`/v1/employees/${withStructure.id}/salary-structure`)
        .set("Cookie", authCookie)
        .send(buildSalaryStructureInput({ effectiveFrom: "2026-01-01" }));

      const res = await http.post("/v1/payroll/runs").set("Cookie", authCookie).send({ period: "2026-09" });
      expect(res.status).toBe(201);
      expect(res.body.headcount).toBe(1);
    });

    it("run with no eligible employees returns 201 with processed=0", async () => {
      // No employees with structures for this period
      const res = await http.post("/v1/payroll/runs").set("Cookie", authCookie).send({ period: "2020-01" });
      expect(res.status).toBe(201);
      expect(res.body.headcount).toBe(0);
    });

    it("returns 400 for an invalid period format", async () => {
      const res = await http.post("/v1/payroll/runs").set("Cookie", authCookie).send({ period: "2026-13" });
      expect(res.status).toBe(400);
    });

    it("returns 400 when period is missing", async () => {
      const res = await http.post("/v1/payroll/runs").set("Cookie", authCookie).send({});
      expect(res.status).toBe(400);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /v1/payroll/runs/:period
  // ---------------------------------------------------------------------------

  describe("GET /payroll/runs/:period", () => {
    it("returns correct summary after a run", async () => {
      const emp = await persistEmployee();
      await http
        .put(`/v1/employees/${emp.id}/salary-structure`)
        .set("Cookie", authCookie)
        .send(buildSalaryStructureInput({ effectiveFrom: "2026-01-01" }));

      await http.post("/v1/payroll/runs").set("Cookie", authCookie).send({ period: "2026-10" });

      const res = await http.get("/v1/payroll/runs/2026-10").set("Cookie", authCookie);
      expect(res.status).toBe(200);
      expect(res.body.period).toBe("2026-10");
      expect(res.body.headcount).toBeGreaterThanOrEqual(1);
      expect(res.body.status).toBe("COMPLETED");
      expect(typeof res.body.totalGrossMinor).toBe("number");
      expect(typeof res.body.totalNetMinor).toBe("number");
    });

    it("returns 404 for a period with no run", async () => {
      const res = await http.get("/v1/payroll/runs/1999-01").set("Cookie", authCookie);
      expect(res.status).toBe(404);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /v1/payroll/runs/:period/results
  // ---------------------------------------------------------------------------

  describe("GET /payroll/runs/:period/results", () => {
    it("returns all results for the period", async () => {
      const emp1 = await persistEmployee();
      const emp2 = await persistEmployee();
      await http
        .put(`/v1/employees/${emp1.id}/salary-structure`)
        .set("Cookie", authCookie)
        .send(buildSalaryStructureInput({ effectiveFrom: "2026-01-01" }));
      await http
        .put(`/v1/employees/${emp2.id}/salary-structure`)
        .set("Cookie", authCookie)
        .send(buildSalaryStructureInput({ effectiveFrom: "2026-01-01" }));

      await http.post("/v1/payroll/runs").set("Cookie", authCookie).send({ period: "2026-11" });

      const res = await http.get("/v1/payroll/runs/2026-11/results").set("Cookie", authCookie);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      const ids = res.body.map((r: { employeeId: string }) => r.employeeId);
      expect(ids).toContain(emp1.id);
      expect(ids).toContain(emp2.id);
    });

    it("filters to one employee when employeeId is provided", async () => {
      const emp1 = await persistEmployee();
      const emp2 = await persistEmployee();
      await http
        .put(`/v1/employees/${emp1.id}/salary-structure`)
        .set("Cookie", authCookie)
        .send(buildSalaryStructureInput({ effectiveFrom: "2026-01-01" }));
      await http
        .put(`/v1/employees/${emp2.id}/salary-structure`)
        .set("Cookie", authCookie)
        .send(buildSalaryStructureInput({ effectiveFrom: "2026-01-01" }));

      await http.post("/v1/payroll/runs").set("Cookie", authCookie).send({ period: "2026-12" });

      const res = await http
        .get("/v1/payroll/runs/2026-12/results")
        .set("Cookie", authCookie)
        .query({ employeeId: emp1.id });
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].employeeId).toBe(emp1.id);
    });

    it("returns empty array for unknown employeeId (not 404)", async () => {
      const emp = await persistEmployee();
      await http
        .put(`/v1/employees/${emp.id}/salary-structure`)
        .set("Cookie", authCookie)
        .send(buildSalaryStructureInput({ effectiveFrom: "2026-01-01" }));
      await http.post("/v1/payroll/runs").set("Cookie", authCookie).send({ period: "2027-01" });

      const res = await http
        .get("/v1/payroll/runs/2027-01/results")
        .set("Cookie", authCookie)
        .query({ employeeId: "00000000-0000-0000-0000-000000000000" });
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });
});
