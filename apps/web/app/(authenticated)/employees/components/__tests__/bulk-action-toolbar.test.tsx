import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@/test/render";
import { BulkActionToolbar } from "../bulk-action-toolbar";

const mockMutate = vi.fn();
const mockToast = vi.fn();

vi.mock("@salary-mgmt/store", () => ({
  useBulkStatusChange: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

vi.mock("@salary-mgmt/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@salary-mgmt/ui")>();
  return {
    ...actual,
    useToast: () => ({ toast: mockToast }),
  };
});

describe("BulkActionToolbar", () => {
  const onDeselect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders null when no ids are selected", () => {
    const { container } = render(
      <BulkActionToolbar selectedIds={[]} onDeselect={onDeselect} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows selected count", () => {
    render(
      <BulkActionToolbar selectedIds={["id1", "id2"]} onDeselect={onDeselect} />,
    );
    expect(screen.getByTestId("bulk-action-toolbar")).toHaveTextContent("2 selected");
  });

  it("confirm button is disabled until a status is selected", () => {
    render(
      <BulkActionToolbar selectedIds={["id1"]} onDeselect={onDeselect} />,
    );
    expect(screen.getByRole("button", { name: /confirm/i })).toBeDisabled();
  });

  it("selecting a status enables the confirm button", async () => {
    render(
      <BulkActionToolbar selectedIds={["id1"]} onDeselect={onDeselect} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /change status/i }));
    await userEvent.click(screen.getByText("Set Active"));
    expect(screen.getByRole("button", { name: /confirm/i })).not.toBeDisabled();
  });

  it("calls mutate with correct ids and status on confirm", async () => {
    render(
      <BulkActionToolbar selectedIds={["id1", "id2"]} onDeselect={onDeselect} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /change status/i }));
    await userEvent.click(screen.getByText("Set Inactive"));
    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));

    expect(mockMutate).toHaveBeenCalledWith(
      { ids: ["id1", "id2"], status: "INACTIVE" },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );
  });

  it("deselect button calls onDeselect", async () => {
    render(
      <BulkActionToolbar selectedIds={["id1"]} onDeselect={onDeselect} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /deselect all/i }));
    expect(onDeselect).toHaveBeenCalledOnce();
  });

  it("shows success toast and calls onDeselect after mutation succeeds", async () => {
    mockMutate.mockImplementation((_body, callbacks) => {
      callbacks.onSuccess({ updated: 3, skipped: 0 });
    });

    render(
      <BulkActionToolbar selectedIds={["id1", "id2", "id3"]} onDeselect={onDeselect} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /change status/i }));
    await userEvent.click(screen.getByText("Terminate"));
    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Status updated" }),
      );
      expect(onDeselect).toHaveBeenCalledOnce();
    });
  });

  it("shows error toast when mutation fails", async () => {
    mockMutate.mockImplementation((_body, callbacks) => {
      callbacks.onError(new Error("network"));
    });

    render(
      <BulkActionToolbar selectedIds={["id1"]} onDeselect={onDeselect} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /change status/i }));
    await userEvent.click(screen.getByText("Set Active"));
    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "destructive" }),
      );
    });
  });
});
