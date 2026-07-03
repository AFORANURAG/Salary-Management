import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../../test/render";
import userEvent from "@testing-library/user-event";
import { EmployeeSearch } from "../components/employee-search";

describe("EmployeeSearch", () => {
  it("does not call onSearch on every keystroke — debounces input", async () => {
    const user = userEvent.setup({ delay: 10 });
    const onSearch = vi.fn();

    render(<EmployeeSearch value="" onSearch={onSearch} />);

    const input = screen.getByRole("searchbox");
    await user.type(input, "ali");

    // With debounce, the callback should not fire once per character
    expect(onSearch).not.toHaveBeenCalledTimes(3);
  });

  it("renders the current value in the input", () => {
    render(<EmployeeSearch value="alice" onSearch={vi.fn()} />);
    expect(screen.getByRole("searchbox")).toHaveValue("alice");
  });
});
