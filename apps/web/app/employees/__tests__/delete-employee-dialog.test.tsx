import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../../test/render";
import userEvent from "@testing-library/user-event";
import { DeleteEmployeeDialog } from "../components/delete-employee-dialog";

const mockMutate = vi.fn();

vi.mock("@salary-mgmt/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@salary-mgmt/store")>();
  return {
    ...actual,
    useDeleteEmployee: vi.fn(() => ({ mutate: mockMutate, isPending: false })),
  };
});

describe("DeleteEmployeeDialog", () => {
  it("clicking Cancel closes the dialog without calling the API", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    mockMutate.mockClear();

    render(
      <DeleteEmployeeDialog
        open
        onOpenChange={onOpenChange}
        employeeId="11111111-1111-1111-1111-111111111111"
        employeeName="Alice Smith"
      />
    );

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(mockMutate).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("clicking Confirm calls the deleteEmployee mutation", async () => {
    const user = userEvent.setup();
    mockMutate.mockClear();

    render(
      <DeleteEmployeeDialog
        open
        onOpenChange={vi.fn()}
        employeeId="11111111-1111-1111-1111-111111111111"
        employeeName="Alice Smith"
      />
    );

    await user.click(screen.getByRole("button", { name: /confirm/i }));

    expect(mockMutate).toHaveBeenCalledWith("11111111-1111-1111-1111-111111111111");
  });
});
