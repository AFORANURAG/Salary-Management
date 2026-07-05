import { describe, expect, it } from "vitest";
import { buildPayslip } from "./payslips.service";

const baseEmployee = {
  id: "emp-1",
  employeeCode: "EMP001",
  name: "Alice Smith",
  department: "Engineering" as const,
  country: "US",
};

const baseResult = {
  period: "2026-06",
  structureId: "struct-1",
  grossMinor: 600_000,
  deductionsMinor: 60_000,
  netMinor: 540_000,
  currency: "USD",
  generatedAt: new Date("2026-07-01T00:00:00Z"),
};

describe("buildPayslip", () => {
  it("maps earnings and deductions to line items and sets totals", () => {
    const components = [
      { code: "BASIC", kind: "EARNING" as const, amountMinor: 500_000 },
      { code: "HRA", kind: "EARNING" as const, amountMinor: 100_000 },
      { code: "PF", kind: "DEDUCTION" as const, amountMinor: 60_000 },
    ];

    const payslip = buildPayslip(baseEmployee, baseResult, components);

    expect(payslip.period).toBe("2026-06");
    expect(payslip.employeeId).toBe("emp-1");
    expect(payslip.employeeCode).toBe("EMP001");
    expect(payslip.name).toBe("Alice Smith");
    expect(payslip.department).toBe("Engineering");
    expect(payslip.country).toBe("US");
    expect(payslip.currency).toBe("USD");
    expect(payslip.grossMinor).toBe(600_000);
    expect(payslip.deductionsMinor).toBe(60_000);
    expect(payslip.netMinor).toBe(540_000);
    expect(payslip.lineItems).toHaveLength(3);
    expect(payslip.lineItems.find((l) => l.code === "BASIC")?.amountMinor).toBe(500_000);
    expect(payslip.lineItems.find((l) => l.code === "PF")?.kind).toBe("DEDUCTION");
  });

  it("handles earnings only (no deductions)", () => {
    const components = [
      { code: "BASIC", kind: "EARNING" as const, amountMinor: 400_000 },
    ];
    const result = { ...baseResult, grossMinor: 400_000, deductionsMinor: 0, netMinor: 400_000 };

    const payslip = buildPayslip(baseEmployee, result, components);

    expect(payslip.lineItems).toHaveLength(1);
    expect(payslip.deductionsMinor).toBe(0);
    expect(payslip.netMinor).toBe(400_000);
  });

  it("handles deductions only (no earnings)", () => {
    const components = [
      { code: "ADVANCE", kind: "DEDUCTION" as const, amountMinor: 20_000 },
    ];
    const result = { ...baseResult, grossMinor: 0, deductionsMinor: 20_000, netMinor: -20_000 };

    const payslip = buildPayslip(baseEmployee, result, components);

    expect(payslip.grossMinor).toBe(0);
    expect(payslip.netMinor).toBe(-20_000);
  });

  it("produces an empty lineItems array when components list is empty", () => {
    const result = { ...baseResult, grossMinor: 0, deductionsMinor: 0, netMinor: 0 };

    const payslip = buildPayslip(baseEmployee, result, []);

    expect(payslip.lineItems).toHaveLength(0);
    expect(payslip.grossMinor).toBe(0);
  });
});
