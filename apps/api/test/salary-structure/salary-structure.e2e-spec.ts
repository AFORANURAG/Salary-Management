import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { persistEmployee } from "../utils/persist-employee";
import { buildSalaryStructureInput } from "../utils/salary-structure-factory";
import { createTestApp } from "../utils/test-app";

describe("Salary Structure (e2e)", () => {
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
  // PUT /v1/employees/:id/salary-structure
  // ---------------------------------------------------------------------------

  describe("PUT /employees/:employeeId/salary-structure", () => {
    it("creates the first structure version (201, effectiveTo null, components persisted)", async () => {
      const emp = await persistEmployee();
      const input = buildSalaryStructureInput({ effectiveFrom: "2024-01-01" });

      const res = await http
        .put(`/v1/employees/${emp.id}/salary-structure`)
        .send(input);

      expect(res.status).toBe(201);
      expect(res.body.employeeId).toBe(emp.id);
      expect(res.body.effectiveFrom).toBe("2024-01-01");
      expect(res.body.effectiveTo).toBeNull();
      expect(res.body.currency).toBe("USD");
      expect(res.body.components).toHaveLength(3);
      expect(res.body.components.map((c: { code: string }) => c.code).sort()).toEqual(
        ["BASIC", "HRA", "PF"],
      );
    });

    it("supersedes prior version: closes it and creates a new one", async () => {
      const emp = await persistEmployee();
      const first = buildSalaryStructureInput({ effectiveFrom: "2024-01-01" });
      await http.put(`/v1/employees/${emp.id}/salary-structure`).send(first);

      const second = buildSalaryStructureInput({
        effectiveFrom: "2024-07-01",
        components: [{ code: "BASIC", kind: "EARNING", amountMinor: 600_000 }],
      });
      const res = await http
        .put(`/v1/employees/${emp.id}/salary-structure`)
        .send(second);

      expect(res.status).toBe(200);
      expect(res.body.effectiveFrom).toBe("2024-07-01");
      expect(res.body.effectiveTo).toBeNull();

      // Prior version is now closed
      const history = await http.get(
        `/v1/employees/${emp.id}/salary-structure/history`,
      );
      const v1 = history.body.find(
        (v: { effectiveFrom: string }) => v.effectiveFrom === "2024-01-01",
      );
      expect(v1.effectiveTo).toBe("2024-06-30");
    });

    it("prior version components are byte-for-byte unchanged after supersede", async () => {
      const emp = await persistEmployee();
      const input = buildSalaryStructureInput({ effectiveFrom: "2024-01-01" });
      await http.put(`/v1/employees/${emp.id}/salary-structure`).send(input);

      await http
        .put(`/v1/employees/${emp.id}/salary-structure`)
        .send(buildSalaryStructureInput({ effectiveFrom: "2024-07-01" }));

      const history = await http.get(
        `/v1/employees/${emp.id}/salary-structure/history`,
      );
      const v1 = history.body.find(
        (v: { effectiveFrom: string }) => v.effectiveFrom === "2024-01-01",
      );
      expect(v1.components.map((c: { code: string }) => c.code).sort()).toEqual(
        ["BASIC", "HRA", "PF"],
      );
      expect(
        v1.components.find((c: { code: string }) => c.code === "BASIC").amountMinor,
      ).toBe(500_000);
    });

    it("returns 409 when new effectiveFrom ≤ current effectiveFrom", async () => {
      const emp = await persistEmployee();
      await http
        .put(`/v1/employees/${emp.id}/salary-structure`)
        .send(buildSalaryStructureInput({ effectiveFrom: "2024-06-01" }));

      const res = await http
        .put(`/v1/employees/${emp.id}/salary-structure`)
        .send(buildSalaryStructureInput({ effectiveFrom: "2024-06-01" }));
      expect(res.status).toBe(409);

      const res2 = await http
        .put(`/v1/employees/${emp.id}/salary-structure`)
        .send(buildSalaryStructureInput({ effectiveFrom: "2024-01-01" }));
      expect(res2.status).toBe(409);
    });

    it("returns 404 for a non-existent employeeId", async () => {
      const res = await http
        .put("/v1/employees/00000000-0000-0000-0000-000000000000/salary-structure")
        .send(buildSalaryStructureInput());
      expect(res.status).toBe(404);
    });

    it("returns 400 for an invalid body (missing effectiveFrom)", async () => {
      const emp = await persistEmployee();
      const { effectiveFrom: _ef, ...withoutDate } = buildSalaryStructureInput();
      const res = await http
        .put(`/v1/employees/${emp.id}/salary-structure`)
        .send(withoutDate);
      expect(res.status).toBe(400);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /v1/employees/:id/salary-structure
  // ---------------------------------------------------------------------------

  describe("GET /employees/:employeeId/salary-structure", () => {
    it("returns the currently active (open) structure with components", async () => {
      const emp = await persistEmployee();
      const input = buildSalaryStructureInput({ effectiveFrom: "2024-01-01" });
      await http.put(`/v1/employees/${emp.id}/salary-structure`).send(input);

      const res = await http.get(`/v1/employees/${emp.id}/salary-structure`);
      expect(res.status).toBe(200);
      expect(res.body.effectiveTo).toBeNull();
      expect(res.body.components).toHaveLength(3);
    });

    it("returns the new version (not the old) after an update", async () => {
      const emp = await persistEmployee();
      await http
        .put(`/v1/employees/${emp.id}/salary-structure`)
        .send(buildSalaryStructureInput({ effectiveFrom: "2024-01-01" }));
      await http
        .put(`/v1/employees/${emp.id}/salary-structure`)
        .send(
          buildSalaryStructureInput({
            effectiveFrom: "2024-07-01",
            components: [{ code: "BASIC", kind: "EARNING", amountMinor: 700_000 }],
          }),
        );

      const res = await http.get(`/v1/employees/${emp.id}/salary-structure`);
      expect(res.status).toBe(200);
      expect(res.body.effectiveFrom).toBe("2024-07-01");
      expect(res.body.components).toHaveLength(1);
    });

    it("returns 404 when employee has no structure", async () => {
      const emp = await persistEmployee();
      const res = await http.get(`/v1/employees/${emp.id}/salary-structure`);
      expect(res.status).toBe(404);
    });

    it("returns 404 for a non-existent employee", async () => {
      const res = await http.get(
        "/v1/employees/00000000-0000-0000-0000-000000000000/salary-structure",
      );
      expect(res.status).toBe(404);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /v1/employees/:id/salary-structure/history
  // ---------------------------------------------------------------------------

  describe("GET /employees/:employeeId/salary-structure/history", () => {
    it("returns all versions in effectiveFrom ascending order", async () => {
      const emp = await persistEmployee();
      await http
        .put(`/v1/employees/${emp.id}/salary-structure`)
        .send(buildSalaryStructureInput({ effectiveFrom: "2024-01-01" }));
      await http
        .put(`/v1/employees/${emp.id}/salary-structure`)
        .send(buildSalaryStructureInput({ effectiveFrom: "2024-07-01" }));
      await http
        .put(`/v1/employees/${emp.id}/salary-structure`)
        .send(buildSalaryStructureInput({ effectiveFrom: "2025-01-01" }));

      const res = await http.get(
        `/v1/employees/${emp.id}/salary-structure/history`,
      );
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(3);
      const dates = res.body.map((v: { effectiveFrom: string }) => v.effectiveFrom);
      expect(dates).toEqual(["2024-01-01", "2024-07-01", "2025-01-01"]);
    });

    it("returns empty array for employee with no structures", async () => {
      const emp = await persistEmployee();
      const res = await http.get(
        `/v1/employees/${emp.id}/salary-structure/history`,
      );
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("no two versions have overlapping [effectiveFrom, effectiveTo] ranges", async () => {
      const emp = await persistEmployee();
      await http
        .put(`/v1/employees/${emp.id}/salary-structure`)
        .send(buildSalaryStructureInput({ effectiveFrom: "2024-01-01" }));
      await http
        .put(`/v1/employees/${emp.id}/salary-structure`)
        .send(buildSalaryStructureInput({ effectiveFrom: "2024-07-01" }));

      const res = await http.get(
        `/v1/employees/${emp.id}/salary-structure/history`,
      );
      const versions: Array<{ effectiveFrom: string; effectiveTo: string | null }> =
        res.body;

      for (let i = 0; i < versions.length - 1; i++) {
        const curr = versions[i];
        const next = versions[i + 1];
        // Closed version's effectiveTo must be < next version's effectiveFrom
        expect(curr.effectiveTo).not.toBeNull();
        expect(curr.effectiveTo! < next.effectiveFrom).toBe(true);
      }
      // Last version is open
      expect(versions[versions.length - 1].effectiveTo).toBeNull();
    });
  });
});
