import { describe, it, expect, vi } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { renderWithFreshClient } from "@/test/render-integration";
import type { ImportResponse } from "@salary-mgmt/types";
import BulkImportPage from "../page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [k: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

function makeFile(name = "employees.csv", size = 100): File {
  return new File(["a".repeat(size)], name, { type: "text/csv" });
}

function uploadFile(input: HTMLElement, file: File) {
  Object.defineProperty(input, "files", { value: [file], writable: false });
  fireEvent.change(input);
}

describe("BO21 – import wizard integration", () => {
  it("all-valid CSV: shows imported count with no failure table", async () => {
    const response: ImportResponse = { imported: 3, failed: [] };

    server.use(
      http.post("http://localhost:3001/v1/employees/import", () => {
        return HttpResponse.json(response, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderWithFreshClient(<BulkImportPage />);

    const input = screen.getByLabelText("Choose CSV file");
    uploadFile(input, makeFile());

    await user.click(screen.getByTestId("preview-import-btn"));

    await waitFor(() =>
      expect(screen.getByTestId("results-step")).toBeInTheDocument(),
    );

    expect(screen.getByTestId("results-step")).toHaveTextContent(
      "3 employees imported successfully.",
    );
    expect(screen.queryByTestId("failure-table")).not.toBeInTheDocument();
  });

  it("partial CSV: shows imported count and failure table", async () => {
    const response: ImportResponse = {
      imported: 2,
      failed: [
        { row: 3, employeeCode: "EMP003", errors: ["email already exists"] },
        { row: 5, employeeCode: null, errors: ["name is required"] },
      ],
    };

    server.use(
      http.post("http://localhost:3001/v1/employees/import", () => {
        return HttpResponse.json(response, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderWithFreshClient(<BulkImportPage />);

    const input = screen.getByLabelText("Choose CSV file");
    uploadFile(input, makeFile());

    await user.click(screen.getByTestId("preview-import-btn"));

    await waitFor(() =>
      expect(screen.getByTestId("failure-table")).toBeInTheDocument(),
    );

    expect(screen.getByTestId("results-step")).toHaveTextContent("2 employees imported");
    expect(screen.getByTestId("results-step")).toHaveTextContent("2 rows failed");

    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(3); // header + 2 failure rows
    expect(screen.getByText("email already exists")).toBeInTheDocument();
    expect(screen.getByText("name is required")).toBeInTheDocument();
  });

  it("server 400: shows error message on upload step", async () => {
    server.use(
      http.post("http://localhost:3001/v1/employees/import", () => {
        return HttpResponse.json({ message: "Missing required header row" }, { status: 400 });
      }),
    );

    const user = userEvent.setup();
    renderWithFreshClient(<BulkImportPage />);

    const input = screen.getByLabelText("Choose CSV file");
    uploadFile(input, makeFile());

    await user.click(screen.getByTestId("preview-import-btn"));

    await waitFor(() =>
      expect(screen.getByTestId("client-error")).toBeInTheDocument(),
    );
    expect(screen.getByTestId("client-error")).toHaveTextContent(
      "Missing required header row",
    );
    // stays on upload step
    expect(screen.getByTestId("drop-zone")).toBeInTheDocument();
  });

  it("Import More after results resets to upload step", async () => {
    server.use(
      http.post("http://localhost:3001/v1/employees/import", () => {
        return HttpResponse.json({ imported: 1, failed: [] }, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderWithFreshClient(<BulkImportPage />);

    const input = screen.getByLabelText("Choose CSV file");
    uploadFile(input, makeFile());
    await user.click(screen.getByTestId("preview-import-btn"));

    await waitFor(() =>
      expect(screen.getByTestId("results-step")).toBeInTheDocument(),
    );

    await user.click(screen.getByTestId("import-more-btn"));
    expect(screen.getByTestId("drop-zone")).toBeInTheDocument();
  });
});
