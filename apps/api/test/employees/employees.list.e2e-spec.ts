import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { persistEmployee, persistEmployees } from "../utils/persist-employee";
import { createTestApp, loginAsAdmin } from "../utils/test-app";

describe("Employees list (e2e)", () => {
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

  describe("search (q)", () => {
    it("matches partial name, case-insensitively", async () => {
      await persistEmployee({ name: "Grace Hopper" });
      await persistEmployee({ name: "Alan Turing" });
      const res = await http.get("/v1/employees").set("Cookie", authCookie).query({ q: "hop" });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe("Grace Hopper");
    });

    it("matches partial employeeCode and email", async () => {
      await persistEmployee({ employeeCode: "EMP-ABC-1", email: "zoe@acme.example.com" });
      const byCode = await http.get("/v1/employees").set("Cookie", authCookie).query({ q: "ABC" });
      expect(byCode.body.data).toHaveLength(1);
      const byEmail = await http.get("/v1/employees").set("Cookie", authCookie).query({ q: "zoe@" });
      expect(byEmail.body.data).toHaveLength(1);
    });

    it("returns an empty page with correct total on no match", async () => {
      await persistEmployees(3);
      const res = await http.get("/v1/employees").set("Cookie", authCookie).query({ q: "zzzz-no-match" });
      expect(res.body.data).toHaveLength(0);
      expect(res.body.total).toBe(0);
    });
  });

  describe("filters", () => {
    it("filters by a single department", async () => {
      await persistEmployee({ department: "Finance" });
      await persistEmployee({ department: "Engineering" });
      const res = await http.get("/v1/employees").set("Cookie", authCookie).query({ department: "Finance" });
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].department).toBe("Finance");
    });

    it("treats repeated filter values as OR within a field", async () => {
      await persistEmployee({ country: "US" });
      await persistEmployee({ country: "IN" });
      await persistEmployee({ country: "GB" });
      const res = await http.get("/v1/employees").set("Cookie", authCookie).query({ country: ["US", "IN"] });
      expect(res.body.total).toBe(2);
    });

    it("composes multiple filter fields as AND", async () => {
      await persistEmployee({ department: "Sales", country: "US" });
      await persistEmployee({ department: "Sales", country: "IN" });
      const res = await http
        .get("/v1/employees")
        .set("Cookie", authCookie)
        .query({ department: "Sales", country: "US" });
      expect(res.body.total).toBe(1);
    });

    it("composes filters with the q search", async () => {
      await persistEmployee({ name: "Nina West", department: "HR" });
      await persistEmployee({ name: "Nina East", department: "Finance" });
      const res = await http.get("/v1/employees").set("Cookie", authCookie).query({ q: "Nina", department: "HR" });
      expect(res.body.total).toBe(1);
      expect(res.body.data[0].name).toBe("Nina West");
    });

    it("filters by employment status (excludes soft-deleted when asked)", async () => {
      await persistEmployee({ employmentStatus: "ACTIVE" });
      await persistEmployee({ employmentStatus: "TERMINATED" });
      const res = await http.get("/v1/employees").set("Cookie", authCookie).query({ status: "ACTIVE" });
      expect(res.body.total).toBe(1);
      expect(res.body.data[0].employmentStatus).toBe("ACTIVE");
    });
  });

  describe("pagination and sort", () => {
    it("returns correct total independent of the page", async () => {
      await persistEmployees(30);
      const res = await http.get("/v1/employees").set("Cookie", authCookie).query({ page: 2, pageSize: 25 });
      expect(res.body.total).toBe(30);
      expect(res.body.page).toBe(2);
      expect(res.body.pageSize).toBe(25);
      expect(res.body.data).toHaveLength(5);
    });

    it("keeps ordering stable across page boundaries (no dup/skip)", async () => {
      await persistEmployees(40);
      const p1 = await http.get("/v1/employees").set("Cookie", authCookie).query({ page: 1, pageSize: 20, sort: "name:asc" });
      const p2 = await http.get("/v1/employees").set("Cookie", authCookie).query({ page: 2, pageSize: 20, sort: "name:asc" });
      const ids = new Set([
        ...p1.body.data.map((e: { id: string }) => e.id),
        ...p2.body.data.map((e: { id: string }) => e.id),
      ]);
      expect(ids.size).toBe(40);
    });

    it("honors sort direction", async () => {
      await persistEmployee({ name: "Aaron" });
      await persistEmployee({ name: "Zed" });
      const asc = await http.get("/v1/employees").set("Cookie", authCookie).query({ sort: "name:asc" });
      const desc = await http.get("/v1/employees").set("Cookie", authCookie).query({ sort: "name:desc" });
      expect(asc.body.data[0].name).toBe("Aaron");
      expect(desc.body.data[0].name).toBe("Zed");
    });

    it("caps pageSize at 100", async () => {
      const res = await http.get("/v1/employees").set("Cookie", authCookie).query({ pageSize: 500 });
      expect(res.body.pageSize).toBe(100);
    });
  });

  describe("contract", () => {
    it("matches PaginatedResponse<Employee>", async () => {
      await persistEmployees(2);
      const res = await http.get("/v1/employees").set("Cookie", authCookie);
      expect(res.body).toHaveProperty("data");
      expect(res.body).toHaveProperty("page");
      expect(res.body).toHaveProperty("pageSize");
      expect(res.body).toHaveProperty("total");
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
