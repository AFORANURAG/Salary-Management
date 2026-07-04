import { describe, expect, it } from "vitest";
import { computePayroll, resolvePeriodStructure } from "./payroll.service";

// ---------------------------------------------------------------------------
// computePayroll
// ---------------------------------------------------------------------------

describe("computePayroll", () => {
  it("sums EARNING components into gross and DEDUCTION into deductions", () => {
    const result = computePayroll([
      { kind: "EARNING", amountMinor: 500_000 },
      { kind: "EARNING", amountMinor: 100_000 },
      { kind: "DEDUCTION", amountMinor: 60_000 },
    ]);
    expect(result.grossMinor).toBe(600_000);
    expect(result.deductionsMinor).toBe(60_000);
    expect(result.netMinor).toBe(540_000);
  });

  it("handles all earnings with no deductions", () => {
    const result = computePayroll([
      { kind: "EARNING", amountMinor: 200_000 },
      { kind: "EARNING", amountMinor: 50_000 },
    ]);
    expect(result.grossMinor).toBe(250_000);
    expect(result.deductionsMinor).toBe(0);
    expect(result.netMinor).toBe(250_000);
  });

  it("handles all deductions with no earnings", () => {
    const result = computePayroll([
      { kind: "DEDUCTION", amountMinor: 10_000 },
    ]);
    expect(result.grossMinor).toBe(0);
    expect(result.deductionsMinor).toBe(10_000);
    expect(result.netMinor).toBe(-10_000);
  });

  it("returns zeros for an empty component list", () => {
    const result = computePayroll([]);
    expect(result.grossMinor).toBe(0);
    expect(result.deductionsMinor).toBe(0);
    expect(result.netMinor).toBe(0);
  });

  it("uses only integer arithmetic — no float drift", () => {
    const result = computePayroll([
      { kind: "EARNING", amountMinor: 333_333 },
      { kind: "DEDUCTION", amountMinor: 111_111 },
    ]);
    expect(result.netMinor).toBe(222_222);
    expect(Number.isInteger(result.grossMinor)).toBe(true);
    expect(Number.isInteger(result.deductionsMinor)).toBe(true);
    expect(Number.isInteger(result.netMinor)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// resolvePeriodStructure
// ---------------------------------------------------------------------------

describe("resolvePeriodStructure", () => {
  const versions = [
    { id: "v1", effectiveFrom: "2023-01-01", effectiveTo: "2023-06-30" },
    { id: "v2", effectiveFrom: "2023-07-01", effectiveTo: "2023-12-31" },
    { id: "v3", effectiveFrom: "2024-01-01", effectiveTo: null },
  ];

  it("returns the version active at the period start date", () => {
    expect(resolvePeriodStructure(versions, "2023-04")?.id).toBe("v1");
    expect(resolvePeriodStructure(versions, "2023-09")?.id).toBe("v2");
    expect(resolvePeriodStructure(versions, "2024-06")?.id).toBe("v3");
  });

  it("returns the open version for a current period", () => {
    expect(resolvePeriodStructure(versions, "2025-01")?.id).toBe("v3");
  });

  it("returns the version whose effectiveFrom equals the period start (boundary)", () => {
    expect(resolvePeriodStructure(versions, "2023-07")?.id).toBe("v2");
    expect(resolvePeriodStructure(versions, "2024-01")?.id).toBe("v3");
  });

  it("returns the version whose effectiveTo equals the last day of the period month (boundary)", () => {
    // v2 effectiveTo = 2023-12-31, period 2023-12 starts on 2023-12-01 which is within range
    expect(resolvePeriodStructure(versions, "2023-12")?.id).toBe("v2");
  });

  it("returns null for a period before any version", () => {
    expect(resolvePeriodStructure(versions, "2022-12")).toBeNull();
  });

  it("returns the historical version (not latest) for a past period", () => {
    expect(resolvePeriodStructure(versions, "2023-03")?.id).toBe("v1");
  });

  it("returns null for empty versions array", () => {
    expect(resolvePeriodStructure([], "2024-01")).toBeNull();
  });
});
