import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/render";
import { BreadcrumbBar } from "../breadcrumb-bar";

const mockPathname = vi.fn(() => "/");

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => mockPathname(),
}));

const mockUseEmployee = vi.fn(() => ({ data: undefined }));
vi.mock("@salary-mgmt/store/query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@salary-mgmt/store/query")>();
  return {
    ...actual,
    useEmployee: (id: string) => mockUseEmployee(id),
  };
});

describe("BreadcrumbBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseEmployee.mockReturnValue({ data: undefined });
  });

  it("renders nothing for root path", () => {
    mockPathname.mockReturnValue("/");
    render(<BreadcrumbBar />);
    expect(screen.queryByTestId("breadcrumb-bar")).not.toBeInTheDocument();
  });

  it("renders single segment for /employees", () => {
    mockPathname.mockReturnValue("/employees");
    render(<BreadcrumbBar />);
    const bar = screen.getByTestId("breadcrumb-bar");
    expect(bar).toBeInTheDocument();
    // Last segment is unlinked
    expect(bar).toHaveTextContent("Employees");
    expect(screen.queryByRole("link", { name: /employees/i })).not.toBeInTheDocument();
  });

  it("renders linked parent and unlinked current for /employees/{uuid}", () => {
    const uuid = "11111111-1111-1111-1111-111111111111";
    mockPathname.mockReturnValue(`/employees/${uuid}`);
    mockUseEmployee.mockReturnValue({ data: { name: "Sarah Mitchell" } });

    render(<BreadcrumbBar />);

    expect(screen.getByRole("link", { name: "Employees" })).toBeInTheDocument();
    expect(screen.getByText("Sarah Mitchell")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sarah Mitchell" })).not.toBeInTheDocument();
  });

  it("falls back to UUID when employee not yet loaded", () => {
    const uuid = "11111111-1111-1111-1111-111111111111";
    mockPathname.mockReturnValue(`/employees/${uuid}`);
    mockUseEmployee.mockReturnValue({ data: undefined });

    render(<BreadcrumbBar />);

    expect(screen.getByText(uuid)).toBeInTheDocument();
  });

  it("renders Payroll / {period} for /payroll/{period}", () => {
    mockPathname.mockReturnValue("/payroll/2025-06");
    render(<BreadcrumbBar />);

    expect(screen.getByRole("link", { name: "Run Payroll" })).toBeInTheDocument();
    expect(screen.getByText("2025-06")).toBeInTheDocument();
  });

  it("renders Admin / Audit Log for /audit-log", () => {
    mockPathname.mockReturnValue("/audit-log");
    render(<BreadcrumbBar />);
    expect(screen.getByText("Audit Log")).toBeInTheDocument();
  });
});
