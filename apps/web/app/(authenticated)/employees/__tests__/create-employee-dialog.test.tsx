import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/render";
import userEvent from "@testing-library/user-event";
import { CreateEmployeeDialog } from "../components/create-employee-dialog";

const mockMutate = vi.fn();

vi.mock("@salary-mgmt/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@salary-mgmt/store")>();
  return {
    ...actual,
    useCreateEmployee: () => ({ mutate: mockMutate, isPending: false }),
  };
});

beforeEach(() => {
  mockMutate.mockClear();
});

describe("CreateEmployeeDialog", () => {
  it("submitting a valid form calls the createEmployee mutation", async () => {
    const user = userEvent.setup();

    render(<CreateEmployeeDialog open onOpenChange={vi.fn()} />);

    await user.type(screen.getByLabelText(/employee code/i), "EMP001");
    await user.type(screen.getByLabelText(/full name/i), "Alice Smith");
    await user.type(screen.getByLabelText(/email/i), "alice@example.com");
    await user.click(screen.getByRole("combobox", { name: /department/i }));
    await user.click(screen.getByRole("option", { name: "Engineering" }));
    await user.type(screen.getByLabelText(/designation/i), "Engineer");
    await user.type(screen.getByLabelText(/country/i), "IN");
    await user.type(screen.getByLabelText(/currency/i), "INR");
    await user.type(screen.getByLabelText(/joining date/i), "2023-01-01");

    await user.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => expect(mockMutate).toHaveBeenCalledOnce());
  });

  it("submitting with empty required fields shows validation errors and does not call the API", async () => {
    const user = userEvent.setup();

    render(<CreateEmployeeDialog open onOpenChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() =>
      expect(screen.getAllByRole("alert").length).toBeGreaterThan(0)
    );
    expect(mockMutate).not.toHaveBeenCalled();
  });
});
