import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/render";
import { EmployeeList } from "../components/employee-list";
import type { Employee, PaginatedResponse } from "@salary-mgmt/types";

vi.mock("@salary-mgmt/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@salary-mgmt/store")>();
  return { ...actual, useEmployees: vi.fn() };
});

const mockEmployee: Employee = {
  id: "11111111-1111-1111-1111-111111111111",
  employeeCode: "EMP001",
  name: "Alice Smith",
  email: "alice@example.com",
  department: "Engineering",
  designation: "Engineer",
  country: "IN",
  currency: "INR",
  joiningDate: "2023-01-01",
  employmentStatus: "ACTIVE",
  costCenter: null,
  createdAt: "2023-01-01T00:00:00Z",
  updatedAt: "2023-01-01T00:00:00Z",
};

const mockPage: PaginatedResponse<Employee> = {
  data: [mockEmployee],
  page: 1,
  pageSize: 25,
  total: 1,
};

describe("EmployeeList", () => {
  it("renders column headings", () => {
    render(
      <EmployeeList
        data={mockPage}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Code")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Department")).toBeInTheDocument();
    expect(screen.getByText("Country")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Joining Date")).toBeInTheDocument();
  });

  it("renders one row per employee", () => {
    render(
      <EmployeeList
        data={mockPage}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("EMP001")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
  });

  it("renders loading skeleton while isLoading is true", () => {
    render(
      <EmployeeList
        data={undefined}
        isLoading={true}
        isError={false}
      />
    );
    expect(screen.getByTestId("employee-list-skeleton")).toBeInTheDocument();
  });

  it("renders empty-state message when total is 0", () => {
    const emptyPage: PaginatedResponse<Employee> = {
      data: [],
      page: 1,
      pageSize: 25,
      total: 0,
    };
    render(
      <EmployeeList
        data={emptyPage}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText(/no employees found/i)).toBeInTheDocument();
  });

  it("renders error message when isError is true", () => {
    render(
      <EmployeeList
        data={undefined}
        isLoading={false}
        isError={true}
      />
    );
    expect(screen.getByText(/failed to load employees/i)).toBeInTheDocument();
  });
});
