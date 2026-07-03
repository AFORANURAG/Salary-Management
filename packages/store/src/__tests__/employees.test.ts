import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { Employee, PaginatedResponse } from "@salary-mgmt/types";
import {
  useEmployees,
  useEmployee,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
} from "../query/employees";
import * as employeeApi from "../api/employees";
import { wrapper } from "./test-utils";

vi.mock("../api/employees");

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

beforeEach(() => {
  vi.resetAllMocks();
});

describe("useEmployees", () => {
  it("calls listEmployees with the provided query and returns paginated data", async () => {
    vi.mocked(employeeApi.listEmployees).mockResolvedValue(mockPage);

    const { result } = renderHook(
      () => useEmployees({ q: "alice", page: 1, pageSize: 25 }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(employeeApi.listEmployees).toHaveBeenCalledWith({ q: "alice", page: 1, pageSize: 25 });
    expect(result.current.data).toEqual(mockPage);
  });

  it("returns paginated data with default empty query", async () => {
    vi.mocked(employeeApi.listEmployees).mockResolvedValue(mockPage);

    const { result } = renderHook(() => useEmployees(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(employeeApi.listEmployees).toHaveBeenCalledWith({});
  });
});

describe("useEmployee", () => {
  it("calls getEmployee with the id and returns the employee", async () => {
    vi.mocked(employeeApi.getEmployee).mockResolvedValue(mockEmployee);

    const { result } = renderHook(
      () => useEmployee("11111111-1111-1111-1111-111111111111"),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(employeeApi.getEmployee).toHaveBeenCalledWith("11111111-1111-1111-1111-111111111111");
    expect(result.current.data).toEqual(mockEmployee);
  });
});

describe("useCreateEmployee", () => {
  it("calls createEmployee and invalidates employees.lists() on success", async () => {
    vi.mocked(employeeApi.createEmployee).mockResolvedValue(mockEmployee);

    const { result } = renderHook(() => useCreateEmployee(), { wrapper });

    result.current.mutate({
      employeeCode: "EMP001",
      name: "Alice Smith",
      email: "alice@example.com",
      department: "Engineering",
      designation: "Engineer",
      country: "IN",
      currency: "INR",
      joiningDate: "2023-01-01",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(employeeApi.createEmployee).toHaveBeenCalledOnce();
    expect(result.current.data).toEqual(mockEmployee);
  });
});

describe("useUpdateEmployee", () => {
  it("calls updateEmployee with id and input and invalidates list and detail keys on success", async () => {
    vi.mocked(employeeApi.updateEmployee).mockResolvedValue({
      ...mockEmployee,
      name: "Alice Updated",
    });

    const { result } = renderHook(() => useUpdateEmployee(), { wrapper });

    result.current.mutate({
      id: "11111111-1111-1111-1111-111111111111",
      input: { name: "Alice Updated" },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(employeeApi.updateEmployee).toHaveBeenCalledWith(
      "11111111-1111-1111-1111-111111111111",
      { name: "Alice Updated" }
    );
  });
});

describe("useDeleteEmployee", () => {
  it("calls deleteEmployee with the id and invalidates employees.lists() on success", async () => {
    vi.mocked(employeeApi.deleteEmployee).mockResolvedValue({
      ...mockEmployee,
      employmentStatus: "TERMINATED",
    });

    const { result } = renderHook(() => useDeleteEmployee(), { wrapper });

    result.current.mutate("11111111-1111-1111-1111-111111111111");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(employeeApi.deleteEmployee).toHaveBeenCalledWith(
      "11111111-1111-1111-1111-111111111111"
    );
  });
});
