import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../../../test/render";
import { SalaryStructureHistory } from "../components/salary-structure-history";

const mockHistory = [
  {
    id: "s1",
    employeeId: "e1",
    effectiveFrom: "2024-01-01",
    effectiveTo: "2024-06-30",
    currency: "USD",
    createdAt: "2024-01-01T00:00:00.000Z",
    components: [
      { id: "c1", structureId: "s1", code: "BASIC", kind: "EARNING" as const, amountMinor: 500_000 },
    ],
  },
  {
    id: "s2",
    employeeId: "e1",
    effectiveFrom: "2024-07-01",
    effectiveTo: null,
    currency: "USD",
    createdAt: "2024-07-01T00:00:00.000Z",
    components: [
      { id: "c2", structureId: "s2", code: "BASIC", kind: "EARNING" as const, amountMinor: 600_000 },
    ],
  },
];

vi.mock("@salary-mgmt/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@salary-mgmt/store")>();
  return { ...actual, useSalaryStructureHistory: vi.fn() };
});

describe("SalaryStructureHistory", () => {
  it("renders each past version with effectiveFrom and effectiveTo", async () => {
    const { useSalaryStructureHistory } = await import("@salary-mgmt/store");
    vi.mocked(useSalaryStructureHistory).mockReturnValue({
      data: mockHistory,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useSalaryStructureHistory>);

    render(<SalaryStructureHistory employeeId="e1" />);

    expect(screen.getByText("2024-01-01")).toBeInTheDocument();
    expect(screen.getByText("2024-06-30")).toBeInTheDocument();
    expect(screen.getByText("2024-07-01")).toBeInTheDocument();
  });
});
