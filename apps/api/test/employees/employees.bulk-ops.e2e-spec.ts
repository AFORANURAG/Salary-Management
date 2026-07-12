import type { INestApplication } from "@nestjs/common";
import { join } from "path";
import { readFileSync } from "fs";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { persistEmployee } from "../utils/persist-employee";
import { persistActiveAdmin, persistHrUser } from "../utils/hr-user-factory";
import { createTestApp } from "../utils/test-app";

const VALID_HEADER =
  "employeeCode,name,email,department,designation,country,currency,joiningDate,employmentStatus";

function makeCsvRow(n: number) {
  return `EMP-BLK-${String(n).padStart(4, "0")},Bulk Name ${n},bulkimport${n}@acme-int.example.com,Engineering,Engineer,US,USD,2023-01-15,ACTIVE`;
}

function makeCsvBuffer(rows: string[]) {
  return Buffer.from([VALID_HEADER, ...rows].join("\n"));
}

describe("Employees Bulk Ops (e2e)", () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let adminCookie: string[];
  let managerCookie: string[];
  let viewerCookie: string[];

  beforeAll(async () => {
    app = await createTestApp();
    http = request(app.getHttpServer());
  });

  beforeEach(async () => {
    const bcrypt = await import("bcrypt");
    const hash = await bcrypt.hash("Test1234!", 1);

    const admin = await persistActiveAdmin({ email: `bulk-admin-${Date.now()}@acme-test.example.com` });
    const adminRes = await http.post("/v1/auth/login").send({ email: admin.email, password: "Test1234!" });
    adminCookie = adminRes.headers["set-cookie"] as unknown as string[];

    const manager = await persistHrUser({
      email: `bulk-mgr-${Date.now()}@acme-test.example.com`,
      role: "HR_MANAGER",
      passwordHash: hash,
      status: "ACTIVE",
    });
    const managerRes = await http.post("/v1/auth/login").send({ email: manager.email, password: "Test1234!" });
    managerCookie = managerRes.headers["set-cookie"] as unknown as string[];

    const viewer = await persistHrUser({
      email: `bulk-viewer-${Date.now()}@acme-test.example.com`,
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

  // -------------------------------------------------------------------------
  // POST /v1/employees/bulk-status
  // -------------------------------------------------------------------------

  describe("POST /v1/employees/bulk-status", () => {
    it("returns 200 with correct updated/skipped counts", async () => {
      const [e1, e2, e3] = await Promise.all([
        persistEmployee({ employmentStatus: "ACTIVE" }),
        persistEmployee({ employmentStatus: "ACTIVE" }),
        persistEmployee({ employmentStatus: "ACTIVE" }),
      ]);

      const res = await http
        .post("/v1/employees/bulk-status")
        .set("Cookie", adminCookie)
        .send({ ids: [e1.id, e2.id, e3.id], status: "INACTIVE" });

      expect(res.status).toBe(200);
      expect(res.body.updated).toBe(3);
      expect(res.body.skipped).toBe(0);
    });

    it("silently skips unknown IDs and reflects them in skipped count", async () => {
      const emp = await persistEmployee({ employmentStatus: "ACTIVE" });
      const unknownId = "00000000-0000-0000-0000-000000000099";

      const res = await http
        .post("/v1/employees/bulk-status")
        .set("Cookie", adminCookie)
        .send({ ids: [emp.id, unknownId], status: "INACTIVE" });

      expect(res.status).toBe(200);
      expect(res.body.updated).toBe(1);
      expect(res.body.skipped).toBe(1);
    });

    it("returns 403 for HR_VIEWER", async () => {
      const emp = await persistEmployee();
      const res = await http
        .post("/v1/employees/bulk-status")
        .set("Cookie", viewerCookie)
        .send({ ids: [emp.id], status: "INACTIVE" });

      expect(res.status).toBe(403);
    });

    it("returns 400 when ids array exceeds 200", async () => {
      const ids = Array.from({ length: 201 }, (_, i) => `00000000-0000-0000-0000-${String(i).padStart(12, "0")}`);
      const res = await http
        .post("/v1/employees/bulk-status")
        .set("Cookie", adminCookie)
        .send({ ids, status: "INACTIVE" });

      expect(res.status).toBe(400);
    });

    it("returns 400 when status field is missing", async () => {
      const emp = await persistEmployee();
      const res = await http
        .post("/v1/employees/bulk-status")
        .set("Cookie", adminCookie)
        .send({ ids: [emp.id] });

      expect(res.status).toBe(400);
    });

    it("returns 200 for HR_MANAGER", async () => {
      const emp = await persistEmployee({ employmentStatus: "ACTIVE" });
      const res = await http
        .post("/v1/employees/bulk-status")
        .set("Cookie", managerCookie)
        .send({ ids: [emp.id], status: "INACTIVE" });

      expect(res.status).toBe(200);
    });
  });

  // -------------------------------------------------------------------------
  // POST /v1/employees/import
  // -------------------------------------------------------------------------

  describe("POST /v1/employees/import", () => {
    it("returns 201 with imported=N and empty failed array for a valid CSV", async () => {
      const csv = makeCsvBuffer([makeCsvRow(1), makeCsvRow(2), makeCsvRow(3)]);

      const res = await http
        .post("/v1/employees/import")
        .set("Cookie", adminCookie)
        .attach("file", csv, { filename: "import.csv", contentType: "text/csv" });

      expect(res.status).toBe(201);
      expect(res.body.imported).toBe(3);
      expect(res.body.failed).toHaveLength(0);
    });

    it("returns 201 with partial result when some rows are invalid", async () => {
      const invalidRow = "BAD,,not-an-email,INVALID_DEPT,Engineer,XX,USD,not-a-date,ACTIVE";
      const csv = makeCsvBuffer([makeCsvRow(10), invalidRow]);

      const res = await http
        .post("/v1/employees/import")
        .set("Cookie", adminCookie)
        .attach("file", csv, { filename: "import.csv", contentType: "text/csv" });

      expect(res.status).toBe(201);
      expect(res.body.imported).toBe(1);
      expect(res.body.failed).toHaveLength(1);
      expect(res.body.failed[0].row).toBe(2);
      expect(res.body.failed[0].errors.length).toBeGreaterThan(0);
    });

    it("returns 400 for a non-CSV file", async () => {
      const res = await http
        .post("/v1/employees/import")
        .set("Cookie", adminCookie)
        .attach("file", Buffer.from("<html></html>"), { filename: "import.html", contentType: "text/html" });

      expect(res.status).toBe(400);
    });

    it("returns 400 when header row is missing", async () => {
      const csv = Buffer.from(makeCsvRow(1));

      const res = await http
        .post("/v1/employees/import")
        .set("Cookie", adminCookie)
        .attach("file", csv, { filename: "import.csv", contentType: "text/csv" });

      expect(res.status).toBe(400);
    });

    it("returns 413 for a file exceeding 2 MB", async () => {
      const largeCsv = Buffer.alloc(2 * 1024 * 1024 + 1, "a");

      const res = await http
        .post("/v1/employees/import")
        .set("Cookie", adminCookie)
        .attach("file", largeCsv, { filename: "import.csv", contentType: "text/csv" });

      expect(res.status).toBe(413);
    });

    it("returns 403 for HR_VIEWER", async () => {
      const csv = makeCsvBuffer([makeCsvRow(20)]);

      const res = await http
        .post("/v1/employees/import")
        .set("Cookie", viewerCookie)
        .attach("file", csv, { filename: "import.csv", contentType: "text/csv" });

      expect(res.status).toBe(403);
    });
  });
});
