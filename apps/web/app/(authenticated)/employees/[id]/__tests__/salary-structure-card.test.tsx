import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/render";
import { SalaryStructureCard } from "../components/salary-structure-card";

const mockStructure = {
  id: "s1",
  employeeId: "e1",
  effectiveFrom: "2024-01-01",
  effectiveTo: null,
  currency: "USD",
  createdAt: "2024-01-01T00:00:00.000Z",
  components: [
    { id: "c1", structureId: "s1", code: "BASIC", kind: "EARNING" as const, amountMinor: 500_000 },
    { id: "c2", structureId: "s1", code: "PF", kind: "DEDUCTION" as const, amountMinor: 60_000 },
  ],
};

vi.mock("@salary-mgmt/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@salary-mgmt/store")>();
  return { ...actual, useSalaryStructure: vi.fn() };
});

describe("SalaryStructureCard", () => {
  it("renders effectiveFrom, currency, and one row per component", async () => {
    const { useSalaryStructure } = await import("@salary-mgmt/store");
    vi.mocked(useSalaryStructure).mockReturnValue({
      data: mockStructure,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useSalaryStructure>);

    render(<SalaryStructureCard employeeId="e1" />);

    expect(screen.getByText("2024-01-01")).toBeInTheDocument();
    expect(screen.getByText("USD")).toBeInTheDocument();
    expect(screen.getByText("BASIC")).toBeInTheDocument();
    expect(screen.getByText("PF")).toBeInTheDocument();
  });

  it("renders loading skeleton while isLoading is true", async () => {
    const { useSalaryStructure } = await import("@salary-mgmt/store");
    vi.mocked(useSalaryStructure).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as unknown as ReturnType<typeof useSalaryStructure>);

    const { container } = render(<SalaryStructureCard employeeId="e1" />);

    expect(container.querySelector("[data-slot='skeleton']")).toBeInTheDocument();
  });

  it("renders empty state when no active structure exists", async () => {
    const { useSalaryStructure } = await import("@salary-mgmt/store");
    vi.mocked(useSalaryStructure).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as unknown as ReturnType<typeof useSalaryStructure>);

    render(<SalaryStructureCard employeeId="e1" />);

    expect(screen.getByText(/no salary structure/i)).toBeInTheDocument();
  });
});
