import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "../../../../test/render";
import userEvent from "@testing-library/user-event";
import { UpsertSalaryStructureDialog } from "../components/upsert-salary-structure-dialog";

const mockMutate = vi.fn();

vi.mock("@salary-mgmt/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@salary-mgmt/store")>();
  return {
    ...actual,
    useUpsertSalaryStructure: () => ({ mutate: mockMutate, isPending: false }),
  };
});

beforeEach(() => {
  mockMutate.mockClear();
});

describe("UpsertSalaryStructureDialog", () => {
  it("submitting a valid form calls useUpsertSalaryStructure mutation", async () => {
    const user = userEvent.setup();
    render(
      <UpsertSalaryStructureDialog
        employeeId="e1"
        open
        onOpenChange={vi.fn()}
      />
    );

    await user.type(screen.getByLabelText(/effective from/i), "2024-07-01");
    await user.click(screen.getByRole("combobox", { name: /currency/i }));
    await user.click(screen.getByRole("option", { name: "USD" }));

    // Fill the first component row
    await user.type(screen.getByLabelText(/code/i), "BASIC");
    await user.click(screen.getByRole("combobox", { name: /kind/i }));
    await user.click(screen.getByRole("option", { name: /earning/i }));
    await user.type(screen.getByLabelText(/amount/i), "500000");

    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(mockMutate).toHaveBeenCalledOnce());
  });

  it("submitting with missing required fields shows validation errors and does not call the API", async () => {
    const user = userEvent.setup();
    render(
      <UpsertSalaryStructureDialog
        employeeId="e1"
        open
        onOpenChange={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() =>
      expect(screen.getAllByRole("alert").length).toBeGreaterThan(0)
    );
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("can add and remove a component row", async () => {
    const user = userEvent.setup();
    render(
      <UpsertSalaryStructureDialog
        employeeId="e1"
        open
        onOpenChange={vi.fn()}
      />
    );

    // Initially one row
    expect(screen.getAllByLabelText(/code/i)).toHaveLength(1);

    // Add a row
    await user.click(screen.getByRole("button", { name: /add component/i }));
    expect(screen.getAllByLabelText(/code/i)).toHaveLength(2);

    // Remove a row
    const removeButtons = screen.getAllByRole("button", { name: /remove/i });
    await user.click(removeButtons[0]!);
    expect(screen.getAllByLabelText(/code/i)).toHaveLength(1);
  });
});
