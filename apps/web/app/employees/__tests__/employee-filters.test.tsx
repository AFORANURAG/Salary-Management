import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../../test/render";
import userEvent from "@testing-library/user-event";
import { EmployeeFilters } from "../components/employee-filters";

describe("EmployeeFilters", () => {
  it("calls onFilterChange with the selected department", async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();

    render(
      <EmployeeFilters
        department={[]}
        country={[]}
        status={[]}
        onFilterChange={onFilterChange}
      />
    );

    await user.click(screen.getByRole("combobox", { name: /department/i }));
    await user.click(screen.getByRole("option", { name: "Engineering" }));

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ department: expect.arrayContaining(["Engineering"]) })
    );
  });

  it("calls onFilterChange with the selected status", async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();

    render(
      <EmployeeFilters
        department={[]}
        country={[]}
        status={[]}
        onFilterChange={onFilterChange}
      />
    );

    await user.click(screen.getByRole("combobox", { name: /status/i }));
    await user.click(screen.getByRole("option", { name: "Active" }));

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ status: expect.arrayContaining(["ACTIVE"]) })
    );
  });
});
