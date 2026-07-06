import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/render";
import userEvent from "@testing-library/user-event";
import { EmployeePagination } from "../components/employee-pagination";

describe("EmployeePagination", () => {
  it("clicking Next calls onPageChange with currentPage + 1", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <EmployeePagination
        page={2}
        pageSize={25}
        total={100}
        onPageChange={onPageChange}
      />
    );

    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("clicking Previous calls onPageChange with currentPage - 1", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <EmployeePagination
        page={3}
        pageSize={25}
        total={100}
        onPageChange={onPageChange}
      />
    );

    await user.click(screen.getByRole("button", { name: /previous/i }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("Previous is disabled on page 1", () => {
    render(
      <EmployeePagination
        page={1}
        pageSize={25}
        total={100}
        onPageChange={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
  });

  it("Next is disabled on the last page", () => {
    render(
      <EmployeePagination
        page={4}
        pageSize={25}
        total={100}
        onPageChange={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });
});
