import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { persistEmployee } from "../utils/persist-employee";
import { buildEmployeeInput } from "../utils/employee-factory";
import { buildSalaryStructureInput } from "../utils/salary-structure-factory";
import { persistActiveAdmin, persistHrUser } from "../utils/hr-user-factory";
import { createTestApp } from "../utils/test-app";

describe("Role guards (e2e)", () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let adminCookie: string[];
  let managerCookie: string[];
  let viewerCookie: string[];

  beforeAll(async () => {
    app = await createTestApp();
    http = request(app.getHttpServer());
  });

  // Re-create users and cookies before each test because truncateAll() in
  // setup-each.ts wipes hr_users between tests.
  beforeEach(async () => {
    const bcrypt = await import("bcrypt");
    const hash = await bcrypt.hash("Test1234!", 1);

    const admin = await persistActiveAdmin({ email: "rg-admin@acme-test.example.com" });
    const adminRes = await http.post("/v1/auth/login").send({ email: admin.email, password: "Test1234!" });
    adminCookie = adminRes.headers["set-cookie"] as unknown as string[];

    const manager = await persistHrUser({
      email: "rg-manager@acme-test.example.com",
      role: "HR_MANAGER",
      passwordHash: hash,
      status: "ACTIVE",
    });
    const managerRes = await http.post("/v1/auth/login").send({ email: manager.email, password: "Test1234!" });
    managerCookie = managerRes.headers["set-cookie"] as unknown as string[];

    const viewer = await persistHrUser({
      email: "rg-viewer@acme-test.example.com",
      role: "HR_VIEWER",
      passwordHash: hash,
      status: "ACTIVE",
    });
    const viewerRes = await http.post("/v1/auth/login").send({ email: viewer.email, password: "Test1234!" });
    viewerCookie = viewerRes.headers["set-cookie"] as unknown as string[];
  });

  afterAll(async () => {
    await app.close();
  });

  // ---------------------------------------------------------------------------
  // Employees
  // ---------------------------------------------------------------------------

  describe("EmployeesController", () => {
    it("HR_VIEWER POST /v1/employees → 403", async () => {
      const res = await http.post("/v1/employees").set("Cookie", viewerCookie).send(buildEmployeeInput());
      expect(res.status).toBe(403);
    });

    it("HR_MANAGER POST /v1/employees → 201", async () => {
      const res = await http.post("/v1/employees").set("Cookie", managerCookie).send(buildEmployeeInput());
      expect(res.status).toBe(201);
    });

    it("HR_VIEWER PATCH /v1/employees/:id → 403", async () => {
      const emp = await persistEmployee();
      const res = await http
        .patch(`/v1/employees/${emp.id}`)
        .set("Cookie", viewerCookie)
        .send({ name: "Changed" });
      expect(res.status).toBe(403);
    });

    it("HR_VIEWER DELETE /v1/employees/:id → 403", async () => {
      const emp = await persistEmployee();
      const res = await http.delete(`/v1/employees/${emp.id}`).set("Cookie", viewerCookie);
      expect(res.status).toBe(403);
    });

    it("HR_VIEWER GET /v1/employees → 200", async () => {
      const res = await http.get("/v1/employees").set("Cookie", viewerCookie);
      expect(res.status).toBe(200);
    });

    it("HR_VIEWER GET /v1/employees/:id → 200", async () => {
      const emp = await persistEmployee();
      const res = await http.get(`/v1/employees/${emp.id}`).set("Cookie", viewerCookie);
      expect(res.status).toBe(200);
    });
  });

  // ---------------------------------------------------------------------------
  // Salary structure
  // ---------------------------------------------------------------------------

  describe("SalaryStructureController", () => {
    it("HR_VIEWER PUT /v1/employees/:id/salary-structure → 403", async () => {
      const emp = await persistEmployee();
      const res = await http
        .put(`/v1/employees/${emp.id}/salary-structure`)
        .set("Cookie", viewerCookie)
        .send(buildSalaryStructureInput());
      expect(res.status).toBe(403);
    });

    it("HR_MANAGER PUT /v1/employees/:id/salary-structure → 200 or 201", async () => {
      const emp = await persistEmployee();
      const res = await http
        .put(`/v1/employees/${emp.id}/salary-structure`)
        .set("Cookie", managerCookie)
        .send(buildSalaryStructureInput());
      expect([200, 201]).toContain(res.status);
    });

    it("HR_VIEWER GET /v1/employees/:id/salary-structure → 200", async () => {
      const emp = await persistEmployee();
      await http
        .put(`/v1/employees/${emp.id}/salary-structure`)
        .set("Cookie", adminCookie)
        .send(buildSalaryStructureInput());
      const res = await http
        .get(`/v1/employees/${emp.id}/salary-structure`)
        .set("Cookie", viewerCookie);
      expect(res.status).toBe(200);
    });
  });

  // ---------------------------------------------------------------------------
  // Payroll
  // ---------------------------------------------------------------------------

  describe("PayrollController", () => {
    it("HR_VIEWER POST /v1/payroll/runs → 403", async () => {
      const res = await http
        .post("/v1/payroll/runs")
        .set("Cookie", viewerCookie)
        .send({ period: "2099-01" });
      expect(res.status).toBe(403);
    });

    it("HR_VIEWER GET /v1/payroll/runs/:period → 200 or 404", async () => {
      const res = await http.get("/v1/payroll/runs/2099-01").set("Cookie", viewerCookie);
      expect([200, 404]).toContain(res.status);
    });
  });
});
