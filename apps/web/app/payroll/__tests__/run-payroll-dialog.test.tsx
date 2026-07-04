import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "../../../test/render";
import userEvent from "@testing-library/user-event";
import { RunPayrollDialog } from "../components/run-payroll-dialog";

vi.mock("@salary-mgmt/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@salary-mgmt/store")>();
  return {
    ...actual,
    useRunPayroll: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  };
});

describe("RunPayrollDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls useRunPayroll with entered period on submit", async () => {
    const user = userEvent.setup();
    const { useRunPayroll } = await import("@salary-mgmt/store");
    const mockMutate = vi.fn();
    vi.mocked(useRunPayroll).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useRunPayroll>);

    render(<RunPayrollDialog open onOpenChange={vi.fn()} />);
    await user.type(screen.getByLabelText(/pay period/i), "2026-07");
    await user.click(screen.getByRole("button", { name: /run payroll/i }));

    expect(mockMutate).toHaveBeenCalledWith("2026-07", expect.any(Object));
  });

  it("shows validation error for invalid period format", async () => {
    const user = userEvent.setup();
    const { useRunPayroll } = await import("@salary-mgmt/store");
    const mockMutate = vi.fn();
    vi.mocked(useRunPayroll).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useRunPayroll>);

    render(<RunPayrollDialog open onOpenChange={vi.fn()} />);
    await user.type(screen.getByLabelText(/pay period/i), "2026-13");
    await user.click(screen.getByRole("button", { name: /run payroll/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/YYYY-MM/i)
    );
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("shows 409 conflict message when period already run", async () => {
    const { useRunPayroll, ApiError } = await import("@salary-mgmt/store");
    vi.mocked(useRunPayroll).mockReturnValue({
      mutate: vi.fn((_period, { onError }) => {
        onError(new ApiError("Already run", 409));
      }),
      isPending: false,
    } as unknown as ReturnType<typeof useRunPayroll>);

    const user = userEvent.setup();
    render(<RunPayrollDialog open onOpenChange={vi.fn()} />);
    await user.type(screen.getByLabelText(/pay period/i), "2026-06");
    await user.click(screen.getByRole("button", { name: /run payroll/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/already been run/i)
    );
  });
});
