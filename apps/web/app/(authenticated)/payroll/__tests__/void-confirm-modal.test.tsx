import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/render";
import userEvent from "@testing-library/user-event";
import { VoidConfirmModal } from "../components/void-confirm-modal";

vi.mock("@salary-mgmt/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@salary-mgmt/store")>();
  return {
    ...actual,
    useVoidPayrollRun: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  };
});

describe("VoidConfirmModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders period in dialog description", () => {
    render(
      <VoidConfirmModal period="2026-06" open onOpenChange={vi.fn()} />,
    );
    expect(screen.getByText(/2026-06/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /void run/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("calls useVoidPayrollRun mutate with the period on confirm", async () => {
    const user = userEvent.setup();
    const { useVoidPayrollRun } = await import("@salary-mgmt/store");
    const mockMutate = vi.fn();
    vi.mocked(useVoidPayrollRun).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useVoidPayrollRun>);

    render(
      <VoidConfirmModal period="2026-06" open onOpenChange={vi.fn()} />,
    );
    await user.click(screen.getByRole("button", { name: /void run/i }));

    expect(mockMutate).toHaveBeenCalledWith("2026-06", expect.any(Object));
  });

  it("shows inline 409 error without closing the modal", async () => {
    const { useVoidPayrollRun, ApiError } = await import("@salary-mgmt/store");
    vi.mocked(useVoidPayrollRun).mockReturnValue({
      mutate: vi.fn((_period, { onError }) => {
        onError(new ApiError("Already voided", 409));
      }),
      isPending: false,
    } as unknown as ReturnType<typeof useVoidPayrollRun>);

    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <VoidConfirmModal period="2026-06" open onOpenChange={onOpenChange} />,
    );
    await user.click(screen.getByRole("button", { name: /void run/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/already been voided/i),
    );
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("closes the modal on cancel", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <VoidConfirmModal period="2026-06" open onOpenChange={onOpenChange} />,
    );
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
