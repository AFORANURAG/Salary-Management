import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildEmployeeInput } from "../utils/employee-factory";
import { persistEmployee } from "../utils/persist-employee";
import { createTestApp } from "../utils/test-app";

describe("Employees CRUD (e2e)", () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;

  beforeAll(async () => {
    app = await createTestApp();
    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /employees", () => {
    it("creates an employee and returns the persisted shape", async () => {
      const input = buildEmployeeInput();
      const res = await http.post("/employees").send(input);
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        employeeCode: input.employeeCode,
        email: input.email,
        employmentStatus: "ACTIVE",
      });
      expect(res.body.id).toBeDefined();
      expect(res.body.createdAt).toBeDefined();
    });

    it("returns 409 on duplicate employeeCode", async () => {
      const existing = await persistEmployee();
      const res = await http
        .post("/employees")
        .send(buildEmployeeInput({ employeeCode: existing.employeeCode }));
      expect(res.status).toBe(409);
    });

    it("returns 409 on duplicate email", async () => {
      const existing = await persistEmployee();
      const res = await http
        .post("/employees")
        .send(buildEmployeeInput({ email: existing.email }));
      expect(res.status).toBe(409);
    });

    it("returns 400 on an invalid body", async () => {
      const res = await http.post("/employees").send({ name: "no other fields" });
      expect(res.status).toBe(400);
    });

    it("returns 400 rejecting unknown fields", async () => {
      const res = await http
        .post("/employees")
        .send({ ...buildEmployeeInput(), salaryMinor: 100000 });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /employees/:id", () => {
    it("returns 200 for an existing employee", async () => {
      const emp = await persistEmployee();
      const res = await http.get(`/employees/${emp.id}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(emp.id);
    });

    it("returns 404 for a non-existent id", async () => {
      const res = await http.get("/employees/00000000-0000-0000-0000-000000000000");
      expect(res.status).toBe(404);
    });

    it("returns 404 (not 500) for a malformed uuid", async () => {
      const res = await http.get("/employees/not-a-uuid");
      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /employees/:id", () => {
    it("applies a partial update", async () => {
      const emp = await persistEmployee({ designation: "Engineer" });
      const res = await http
        .patch(`/employees/${emp.id}`)
        .send({ designation: "Senior Engineer" });
      expect(res.status).toBe(200);
      expect(res.body.designation).toBe("Senior Engineer");
    });

    it("returns 409 when updating email to one already taken", async () => {
      const a = await persistEmployee();
      const b = await persistEmployee();
      const res = await http.patch(`/employees/${b.id}`).send({ email: a.email });
      expect(res.status).toBe(409);
    });

    it("returns 404 when updating a non-existent employee", async () => {
      const res = await http
        .patch("/employees/00000000-0000-0000-0000-000000000000")
        .send({ designation: "x" });
      expect(res.status).toBe(404);
    });

    it("ignores or rejects attempts to change immutable fields", async () => {
      const emp = await persistEmployee();
      const res = await http.patch(`/employees/${emp.id}`).send({ id: "hacked" });
      expect(res.status === 200 || res.status === 400).toBe(true);
      if (res.status === 200) {
        expect(res.body.id).toBe(emp.id);
      }
    });
  });

  describe("DELETE /employees/:id (soft delete)", () => {
    it("soft-deletes: sets a non-active status and preserves the record", async () => {
      const emp = await persistEmployee({ employmentStatus: "ACTIVE" });
      const del = await http.delete(`/employees/${emp.id}`);
      expect(del.status === 200 || del.status === 204).toBe(true);

      const fetched = await http.get(`/employees/${emp.id}`);
      expect(fetched.status).toBe(200);
      expect(fetched.body.employmentStatus).not.toBe("ACTIVE");
    });

    it("is a safe no-op on double delete", async () => {
      const emp = await persistEmployee();
      await http.delete(`/employees/${emp.id}`);
      const second = await http.delete(`/employees/${emp.id}`);
      expect(second.status === 200 || second.status === 204).toBe(true);
    });

    it("returns 404 for a non-existent employee", async () => {
      const res = await http.delete("/employees/00000000-0000-0000-0000-000000000000");
      expect(res.status).toBe(404);
    });
  });
});
