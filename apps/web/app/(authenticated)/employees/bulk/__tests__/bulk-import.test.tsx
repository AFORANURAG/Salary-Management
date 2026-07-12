import { describe, it, expect, vi, beforeEach } from "vitest";
import type React from "react";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, fireEvent } from "@/test/render";
import BulkImportPage from "../page";

const mockMutate = vi.fn();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [k: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("@salary-mgmt/store", () => ({
  useEmployeeImport: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

function makeFile(name: string, size: number, type = "text/csv"): File {
  const content = "a".repeat(size);
  return new File([content], name, { type });
}

function uploadFile(input: HTMLElement, file: File) {
  Object.defineProperty(input, "files", { value: [file], writable: false });
  fireEvent.change(input);
}

describe("BulkImportPage — upload step", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders upload step by default", () => {
    render(<BulkImportPage />);
    expect(screen.getByTestId("drop-zone")).toBeInTheDocument();
    expect(screen.getByTestId("preview-import-btn")).toBeDisabled();
  });

  it("shows template download link", () => {
    render(<BulkImportPage />);
    const link = screen.getByTestId("download-template");
    expect(link).toHaveAttribute("href", "/templates/employees-import-template.csv");
    expect(link).toHaveAttribute("download");
  });

  it("rejects non-CSV file", async () => {
    render(<BulkImportPage />);
    const input = screen.getByLabelText("Choose CSV file");
    uploadFile(input, makeFile("employees.xlsx", 100, "application/vnd.ms-excel"));
    expect(screen.getByTestId("client-error")).toHaveTextContent("Only .csv files are accepted.");
    expect(screen.queryByTestId("selected-file")).not.toBeInTheDocument();
  });

  it("rejects file larger than 2 MB", async () => {
    render(<BulkImportPage />);
    const input = screen.getByLabelText("Choose CSV file");
    const bigFile = makeFile("big.csv", 2 * 1024 * 1024 + 1);
    await userEvent.upload(input, bigFile);
    expect(screen.getByTestId("client-error")).toHaveTextContent("File exceeds 2 MB limit.");
  });

  it("shows file name and size after valid file selected", async () => {
    render(<BulkImportPage />);
    const input = screen.getByLabelText("Choose CSV file");
    uploadFile(input, makeFile("employees.csv", 1024));
    expect(screen.getByTestId("selected-file")).toHaveTextContent("employees.csv");
    expect(screen.getByTestId("preview-import-btn")).not.toBeDisabled();
  });

  it("calls mutate with the file on confirm", async () => {
    render(<BulkImportPage />);
    const input = screen.getByLabelText("Choose CSV file");
    const file = makeFile("employees.csv", 100);
    uploadFile(input, file);
    await userEvent.click(screen.getByTestId("preview-import-btn"));
    expect(mockMutate).toHaveBeenCalledWith(file, expect.objectContaining({ onSuccess: expect.any(Function) }));
  });

  it("shows server error message on failure", async () => {
    mockMutate.mockImplementation((_file, callbacks) => {
      callbacks.onError(new Error("Missing header row"));
    });
    render(<BulkImportPage />);
    const input = screen.getByLabelText("Choose CSV file");
    uploadFile(input, makeFile("employees.csv", 100));
    await userEvent.click(screen.getByTestId("preview-import-btn"));
    await waitFor(() => {
      expect(screen.getByTestId("client-error")).toHaveTextContent("Missing header row");
    });
  });
});

describe("BulkImportPage — results step", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows imported count and no failure table when all succeed", async () => {
    mockMutate.mockImplementation((_file, callbacks) => {
      callbacks.onSuccess({ imported: 5, failed: [] });
    });
    render(<BulkImportPage />);
    const input = screen.getByLabelText("Choose CSV file");
    uploadFile(input, makeFile("employees.csv", 100));
    await userEvent.click(screen.getByTestId("preview-import-btn"));
    await waitFor(() => {
      expect(screen.getByTestId("results-step")).toBeInTheDocument();
    });
    expect(screen.getByTestId("results-step")).toHaveTextContent("5 employees imported successfully.");
    expect(screen.queryByTestId("failure-table")).not.toBeInTheDocument();
  });

  it("renders failure table rows when partial import", async () => {
    mockMutate.mockImplementation((_file, callbacks) => {
      callbacks.onSuccess({
        imported: 2,
        failed: [
          { row: 2, employeeCode: "EMP002", errors: ["email already exists"] },
          { row: 4, employeeCode: null, errors: ["name is required", "email is required"] },
        ],
      });
    });
    render(<BulkImportPage />);
    const input = screen.getByLabelText("Choose CSV file");
    uploadFile(input, makeFile("employees.csv", 100));
    await userEvent.click(screen.getByTestId("preview-import-btn"));
    await waitFor(() => expect(screen.getByTestId("failure-table")).toBeInTheDocument());
    const rows = screen.getAllByRole("row");
    // header + 2 data rows
    expect(rows).toHaveLength(3);
    expect(screen.getByText("email already exists")).toBeInTheDocument();
    expect(screen.getByText(/name is required/)).toBeInTheDocument();
  });

  it("Import More resets to upload step", async () => {
    mockMutate.mockImplementation((_file, callbacks) => {
      callbacks.onSuccess({ imported: 1, failed: [] });
    });
    render(<BulkImportPage />);
    const input = screen.getByLabelText("Choose CSV file");
    uploadFile(input, makeFile("employees.csv", 100));
    await userEvent.click(screen.getByTestId("preview-import-btn"));
    await waitFor(() => expect(screen.getByTestId("results-step")).toBeInTheDocument());
    await userEvent.click(screen.getByTestId("import-more-btn"));
    expect(screen.getByTestId("drop-zone")).toBeInTheDocument();
  });

  it("View Employees navigates to /employees", async () => {
    mockMutate.mockImplementation((_file, callbacks) => {
      callbacks.onSuccess({ imported: 1, failed: [] });
    });
    render(<BulkImportPage />);
    const input = screen.getByLabelText("Choose CSV file");
    uploadFile(input, makeFile("employees.csv", 100));
    await userEvent.click(screen.getByTestId("preview-import-btn"));
    await waitFor(() => expect(screen.getByTestId("results-step")).toBeInTheDocument());
    await userEvent.click(screen.getByTestId("view-employees-btn"));
    expect(mockPush).toHaveBeenCalledWith("/employees");
  });
});
