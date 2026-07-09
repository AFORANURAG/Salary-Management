import { describe, expect, it } from "vitest";
import { computeDiff } from "./payroll.service";
import type { DiffResultRow } from "./payroll.service";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function row(overrides: Partial<DiffResultRow> & { employeeId: string }): DiffResultRow {
  return {
    employeeCode: `EMP-${overrides.employeeId.slice(0, 4)}`,
    name: "Test Employee",
    department: "Engineering",
    netMinor: 500_000,
    currency: "USD",
    ...overrides,
  };
}

const empA = "aaaa0000-0000-0000-0000-000000000001";
const empB = "bbbb0000-0000-0000-0000-000000000002";
const empC = "cccc0000-0000-0000-0000-000000000003";

// ---------------------------------------------------------------------------
// PO6 — computeDiff unit spec (RED: function not yet wired into getDiff endpoint)
// ---------------------------------------------------------------------------

describe("computeDiff", () => {
  it("identifies employees in base but not compare as new hires", () => {
    const base = [row({ employeeId: empA }), row({ employeeId: empB })];
    const compare = [row({ employeeId: empA })];

    const result = computeDiff(base, compare);

    expect(result.newHires).toHaveLength(1);
    expect(result.newHires[0]!.employeeId).toBe(empB);
    expect(result.terminations).toHaveLength(0);
    expect(result.salaryChanges).toHaveLength(0);
  });

  it("identifies employees in compare but not base as terminations", () => {
    const base = [row({ employeeId: empA })];
    const compare = [row({ employeeId: empA }), row({ employeeId: empC })];

    const result = computeDiff(base, compare);

    expect(result.terminations).toHaveLength(1);
    expect(result.terminations[0]!.employeeId).toBe(empC);
    expect(result.newHires).toHaveLength(0);
    expect(result.salaryChanges).toHaveLength(0);
  });

  it("identifies employees in both periods with changed netMinor as salary changes", () => {
    const base = [row({ employeeId: empA, netMinor: 600_000 })];
    const compare = [row({ employeeId: empA, netMinor: 500_000 })];

    const result = computeDiff(base, compare);

    expect(result.salaryChanges).toHaveLength(1);
    const change = result.salaryChanges[0]!;
    expect(change.employeeId).toBe(empA);
    expect(change.baseNetMinor).toBe(600_000);
    expect(change.compareNetMinor).toBe(500_000);
    expect(change.deltaMinor).toBe(100_000);
    expect(result.newHires).toHaveLength(0);
    expect(result.terminations).toHaveLength(0);
  });

  it("does not include employees with unchanged netMinor in salaryChanges", () => {
    const base = [row({ employeeId: empA, netMinor: 500_000 })];
    const compare = [row({ employeeId: empA, netMinor: 500_000 })];

    const result = computeDiff(base, compare);

    expect(result.salaryChanges).toHaveLength(0);
    expect(result.newHires).toHaveLength(0);
    expect(result.terminations).toHaveLength(0);
  });

  it("correctly computes all three categories from mixed fixture data", () => {
    // empA: in both, salary changed (increase)
    // empB: only in base → new hire
    // empC: only in compare → termination
    const base = [
      row({ employeeId: empA, netMinor: 600_000 }),
      row({ employeeId: empB, netMinor: 400_000 }),
    ];
    const compare = [
      row({ employeeId: empA, netMinor: 500_000 }),
      row({ employeeId: empC, netMinor: 450_000 }),
    ];

    const result = computeDiff(base, compare);

    expect(result.newHires.map((r) => r.employeeId)).toEqual([empB]);
    expect(result.terminations.map((r) => r.employeeId)).toEqual([empC]);
    expect(result.salaryChanges).toHaveLength(1);
    expect(result.salaryChanges[0]!.deltaMinor).toBe(100_000);
  });

  it("computes correct baseTotalNetMinor and compareTotalNetMinor", () => {
    const base = [
      row({ employeeId: empA, netMinor: 600_000 }),
      row({ employeeId: empB, netMinor: 400_000 }),
    ];
    const compare = [row({ employeeId: empA, netMinor: 500_000 })];

    const result = computeDiff(base, compare);

    expect(result.baseTotalNetMinor).toBe(1_000_000);
    expect(result.compareTotalNetMinor).toBe(500_000);
  });

  it("returns all empty arrays and zero totals when both periods have no results", () => {
    const result = computeDiff([], []);

    expect(result.newHires).toHaveLength(0);
    expect(result.terminations).toHaveLength(0);
    expect(result.salaryChanges).toHaveLength(0);
    expect(result.baseTotalNetMinor).toBe(0);
    expect(result.compareTotalNetMinor).toBe(0);
  });

  it("deltaMinor is negative when base net is lower than compare net (salary decrease)", () => {
    const base = [row({ employeeId: empA, netMinor: 400_000 })];
    const compare = [row({ employeeId: empA, netMinor: 500_000 })];

    const result = computeDiff(base, compare);

    expect(result.salaryChanges[0]!.deltaMinor).toBe(-100_000);
  });
});
