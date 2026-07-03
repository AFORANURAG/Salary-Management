import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../../test/render";
import { EditEmployeeDialog } from "../components/edit-employee-dialog";
import type { Employee } from "@salary-mgmt/types";

vi.mock("@salary-mgmt/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@salary-mgmt/store")>();
  return {
    ...actual,
    useUpdateEmployee: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  };
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

describe("EditEmployeeDialog", () => {
  it("pre-populates all fields from the passed employee record", () => {
    render(
      <EditEmployeeDialog
        open
        onOpenChange={vi.fn()}
        employee={mockEmployee}
      />
    );

    expect(screen.getByLabelText(/employee code/i)).toHaveValue("EMP001");
    expect(screen.getByLabelText(/full name/i)).toHaveValue("Alice Smith");
    expect(screen.getByLabelText(/email/i)).toHaveValue("alice@example.com");
    expect(screen.getByLabelText(/department/i)).toHaveValue("Engineering");
    expect(screen.getByLabelText(/designation/i)).toHaveValue("Engineer");
    expect(screen.getByLabelText(/country/i)).toHaveValue("IN");
    expect(screen.getByLabelText(/currency/i)).toHaveValue("INR");
  });
});
