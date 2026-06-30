import { describe, expect, it } from "vitest";
import { addMinor, assertMinorUnits, formatMinor, subtractMinor, sumMinor } from "./index";

describe("money helpers", () => {
  it("rejects non-integer minor units", () => {
    expect(() => assertMinorUnits(10.5)).toThrow(/integer minor units/);
  });

  it("adds and subtracts minor units", () => {
    expect(addMinor(100, 50)).toBe(150);
    expect(subtractMinor(100, 30)).toBe(70);
  });

  it("sums minor unit arrays", () => {
    expect(sumMinor([100, 200, 50])).toBe(350);
  });

  it("formats minor units as currency", () => {
    expect(formatMinor(12345, "USD")).toMatch(/123\.45/);
  });
});
