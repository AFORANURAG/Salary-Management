import type { ComponentInput, UpsertSalaryStructureInput } from "@salary-mgmt/types";

/** Build a valid UpsertSalaryStructureInput; override any field as needed. */
export function buildSalaryStructureInput(
  overrides: Partial<UpsertSalaryStructureInput> & { components?: ComponentInput[] } = {},
): UpsertSalaryStructureInput {
  return {
    effectiveFrom: "2024-01-01",
    currency: "USD",
    components: [
      { code: "BASIC", kind: "EARNING", amountMinor: 500_000 },
      { code: "HRA", kind: "EARNING", amountMinor: 100_000 },
      { code: "PF", kind: "DEDUCTION", amountMinor: 60_000 },
    ],
    ...overrides,
  };
}
