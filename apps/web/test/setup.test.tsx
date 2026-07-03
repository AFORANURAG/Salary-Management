import { describe, it, expect } from "vitest";
import { render, screen } from "./render";

describe("test harness", () => {
  it("renders without crashing", () => {
    render(<div data-testid="hello">hello</div>);
    expect(screen.getByTestId("hello")).toBeInTheDocument();
  });
});
