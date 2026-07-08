import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { persistEmployee } from "../utils/persist-employee";
import { persistPayrollRun } from "../utils/persist-payroll-run";
import { buildSalaryStructureInput } from "../utils/salary-structure-factory";
import { persistActiveAdmin, persistHrUser } from "../utils/hr-user-factory";
import { createTestApp, loginAsAdmin } from "../utils/test-app";

describe("Payroll Ops (e2e)", () => {
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
  // PO7 — GET /v1/payroll/runs
  // ---------------------------------------------------------------------------

  describe("GET /v1/payroll/runs", () => {
    it("returns 200 with a paginated list of runs", async () => {
      await persistPayrollRun({ period: "2026-01", headcount: 10, totalNetMinor: 5_000_000 });
      await persistPayrollRun({ period: "2026-02", headcount: 11, totalNetMinor: 5_100_000 });

      const res = await http.get("/v1/payroll/runs").set("Cookie", authCookie);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.total).toBeGreaterThanOrEqual(2);
      const periods = res.body.data.map((r: { period: string }) => r.period);
      expect(periods).toContain("2026-01");
      expect(periods).toContain("2026-02");
    });

    it("filters by status=COMPLETED", async () => {
      await persistPayrollRun({ period: "2026-03", status: "COMPLETED" });
      await persistPayrollRun({ period: "2026-04", status: "VOIDED" });

      const res = await http
        .get("/v1/payroll/runs")
        .set("Cookie", authCookie)
        .query({ status: "COMPLETED" });

      expect(res.status).toBe(200);
      const statuses = res.body.data.map((r: { status: string }) => r.status);
      expect(statuses.every((s: string) => s === "COMPLETED")).toBe(true);
    });

    it("filters by status=VOIDED", async () => {
      await persistPayrollRun({ period: "2026-05", status: "VOIDED", voidedBy: "admin@acme.com", voidedAt: new Date() });

      const res = await http
        .get("/v1/payroll/runs")
        .set("Cookie", authCookie)
        .query({ status: "VOIDED" });

      expect(res.status).toBe(200);
      const periods = res.body.data.map((r: { period: string }) => r.period);
      expect(periods).toContain("2026-05");
    });

    it("returns 401 without a session cookie", async () => {
      const res = await http.get("/v1/payroll/runs");
      expect(res.status).toBe(401);
    });

    it("respects pageSize param", async () => {
      await persistPayrollRun({ period: "2026-06" });
      await persistPayrollRun({ period: "2026-07" });
      await persistPayrollRun({ period: "2026-08" });

      const res = await http
        .get("/v1/payroll/runs")
        .set("Cookie", authCookie)
        .query({ pageSize: 2 });

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
    });
  });

  // ---------------------------------------------------------------------------
  // PO8 — POST /v1/payroll/runs/:period/void
  // ---------------------------------------------------------------------------

  describe("POST /v1/payroll/runs/:period/void", () => {
    it("voids a COMPLETED run — 200, status becomes VOIDED, voidedBy set (ADMIN)", async () => {
      await persistPayrollRun({ period: "2026-09", status: "COMPLETED" });

      const res = await http
        .post("/v1/payroll/runs/2026-09/void")
        .set("Cookie", authCookie);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("VOIDED");
      expect(res.body.voidedAt).toBeTruthy();
      expect(res.body.voidedBy).toBeTruthy();
    });

    it("returns 403 when caller is HR_MANAGER (not ADMIN)", async () => {
      await persistPayrollRun({ period: "2026-10", status: "COMPLETED" });

      const bcrypt = await import("bcrypt");
      const hash = await bcrypt.hash("Test1234!", 1);
      const manager = await persistHrUser({
        email: "manager-void-test@acme-test.example.com",
        role: "HR_MANAGER",
        passwordHash: hash,
        status: "ACTIVE",
      });
      const loginRes = await request(app.getHttpServer())
        .post("/v1/auth/login")
        .send({ email: manager.email, password: "Test1234!" });
      const managerCookie = loginRes.headers["set-cookie"] as unknown as string[];

      const res = await http
        .post("/v1/payroll/runs/2026-10/void")
        .set("Cookie", managerCookie);

      expect(res.status).toBe(403);
    });

    it("returns 409 when run is already VOIDED", async () => {
      await persistPayrollRun({ period: "2026-11", status: "VOIDED", voidedAt: new Date(), voidedBy: "admin@acme.com" });

      const res = await http
        .post("/v1/payroll/runs/2026-11/void")
        .set("Cookie", authCookie);

      expect(res.status).toBe(409);
    });

    it("returns 422 when run is PENDING (cannot void in-progress run)", async () => {
      await persistPayrollRun({ period: "2026-12", status: "PENDING", ranAt: null });

      const res = await http
        .post("/v1/payroll/runs/2026-12/void")
        .set("Cookie", authCookie);

      expect(res.status).toBe(422);
    });

    it("returns 404 when no run exists for the period", async () => {
      const res = await http
        .post("/v1/payroll/runs/1999-01/void")
        .set("Cookie", authCookie);

      expect(res.status).toBe(404);
    });

    it("preserves PayrollResult rows after voiding — does not cascade delete", async () => {
      const emp = await persistEmployee();
      await http
        .put(`/v1/employees/${emp.id}/salary-structure`)
        .set("Cookie", authCookie)
        .send(buildSalaryStructureInput({ effectiveFrom: "2026-01-01" }));
      await http.post("/v1/payroll/runs").set("Cookie", authCookie).send({ period: "2027-02" });

      await http.post("/v1/payroll/runs/2027-02/void").set("Cookie", authCookie);

      const results = await http.get("/v1/payroll/runs/2027-02/results").set("Cookie", authCookie);
      expect(results.status).toBe(200);
      expect(Array.isArray(results.body)).toBe(true);
      expect(results.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ---------------------------------------------------------------------------
  // PO9 — GET /v1/payroll/runs/:period/diff
  // ---------------------------------------------------------------------------

  describe("GET /v1/payroll/runs/:period/diff", () => {
    it("returns 400 when compareTo param is missing", async () => {
      await persistPayrollRun({ period: "2027-03" });

      const res = await http
        .get("/v1/payroll/runs/2027-03/diff")
        .set("Cookie", authCookie);

      expect(res.status).toBe(400);
    });

    it("returns 404 when the base period has no run", async () => {
      await persistPayrollRun({ period: "2027-04" });

      const res = await http
        .get("/v1/payroll/runs/1998-01/diff")
        .set("Cookie", authCookie)
        .query({ compareTo: "2027-04" });

      expect(res.status).toBe(404);
    });

    it("returns 404 when the compareTo period has no run", async () => {
      await persistPayrollRun({ period: "2027-05" });

      const res = await http
        .get("/v1/payroll/runs/2027-05/diff")
        .set("Cookie", authCookie)
        .query({ compareTo: "1998-01" });

      expect(res.status).toBe(404);
    });

    it("returns 200 with correct diff structure for two periods", async () => {
      const emp = await persistEmployee();
      await http
        .put(`/v1/employees/${emp.id}/salary-structure`)
        .set("Cookie", authCookie)
        .send(buildSalaryStructureInput({ effectiveFrom: "2026-01-01" }));

      await http.post("/v1/payroll/runs").set("Cookie", authCookie).send({ period: "2027-06" });
      await http.post("/v1/payroll/runs").set("Cookie", authCookie).send({ period: "2027-07" });

      const res = await http
        .get("/v1/payroll/runs/2027-07/diff")
        .set("Cookie", authCookie)
        .query({ compareTo: "2027-06" });

      expect(res.status).toBe(200);
      expect(res.body.basePeriod).toBe("2027-07");
      expect(res.body.comparePeriod).toBe("2027-06");
      expect(Array.isArray(res.body.newHires)).toBe(true);
      expect(Array.isArray(res.body.terminations)).toBe(true);
      expect(Array.isArray(res.body.salaryChanges)).toBe(true);
      expect(res.body.totals).toBeDefined();
      expect(typeof res.body.totals.baseTotalNetMinor).toBe("number");
      expect(typeof res.body.totals.compareTotalNetMinor).toBe("number");
      expect(typeof res.body.totals.deltaTotalMinor).toBe("number");
    });

    it("returns 400 for a malformed compareTo value", async () => {
      await persistPayrollRun({ period: "2027-08" });

      const res = await http
        .get("/v1/payroll/runs/2027-08/diff")
        .set("Cookie", authCookie)
        .query({ compareTo: "not-a-period" });

      expect(res.status).toBe(400);
    });

    it("returns 401 without a session cookie", async () => {
      const res = await http
        .get("/v1/payroll/runs/2027-08/diff")
        .query({ compareTo: "2027-07" });

      expect(res.status).toBe(401);
    });

    it("diff runs on VOIDED periods — voided data is still informational", async () => {
      const emp = await persistEmployee();
      await http
        .put(`/v1/employees/${emp.id}/salary-structure`)
        .set("Cookie", authCookie)
        .send(buildSalaryStructureInput({ effectiveFrom: "2026-01-01" }));

      await http.post("/v1/payroll/runs").set("Cookie", authCookie).send({ period: "2027-09" });
      await http.post("/v1/payroll/runs").set("Cookie", authCookie).send({ period: "2027-10" });
      // Void the base period
      await http.post("/v1/payroll/runs/2027-10/void").set("Cookie", authCookie);

      const res = await http
        .get("/v1/payroll/runs/2027-10/diff")
        .set("Cookie", authCookie)
        .query({ compareTo: "2027-09" });

      expect(res.status).toBe(200);
      expect(res.body.basePeriod).toBe("2027-10");
    });
  });
});
