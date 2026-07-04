import { describe, expect, it } from "vitest";
import { closeVersion, resolveActiveVersion } from "./salary-structure.service";

describe("closeVersion", () => {
  it("sets effectiveTo to the day before the new effectiveFrom", () => {
    expect(closeVersion("2024-02-01")).toBe("2024-01-31");
  });

  it("handles month-boundary correctly (March 1 → Feb 28 non-leap)", () => {
    expect(closeVersion("2023-03-01")).toBe("2023-02-28");
  });

  it("handles month-boundary correctly (March 1 → Feb 29 leap year)", () => {
    expect(closeVersion("2024-03-01")).toBe("2024-02-29");
  });

  it("handles year-boundary correctly (Jan 1 → Dec 31)", () => {
    expect(closeVersion("2025-01-01")).toBe("2024-12-31");
  });
});

describe("resolveActiveVersion", () => {
  const versions = [
    { id: "v1", effectiveFrom: "2023-01-01", effectiveTo: "2023-06-30" },
    { id: "v2", effectiveFrom: "2023-07-01", effectiveTo: "2023-12-31" },
    { id: "v3", effectiveFrom: "2024-01-01", effectiveTo: null },
  ];

  it("returns the version whose range contains the queried date", () => {
    expect(resolveActiveVersion(versions, "2023-04-15")?.id).toBe("v1");
    expect(resolveActiveVersion(versions, "2023-09-01")?.id).toBe("v2");
  });

  it("returns the open version (effectiveTo = null) for a current date", () => {
    expect(resolveActiveVersion(versions, "2024-06-01")?.id).toBe("v3");
  });

  it("returns the version exactly on effectiveFrom boundary", () => {
    expect(resolveActiveVersion(versions, "2023-07-01")?.id).toBe("v2");
  });

  it("returns the version exactly on effectiveTo boundary", () => {
    expect(resolveActiveVersion(versions, "2023-12-31")?.id).toBe("v2");
  });

  it("returns undefined for a date before all versions", () => {
    expect(resolveActiveVersion(versions, "2022-12-31")).toBeUndefined();
  });

  it("returns undefined for a date in a gap between versions (if any)", () => {
    const withGap = [
      { id: "a", effectiveFrom: "2023-01-01", effectiveTo: "2023-06-30" },
      { id: "b", effectiveFrom: "2023-08-01", effectiveTo: null },
    ];
    expect(resolveActiveVersion(withGap, "2023-07-15")).toBeUndefined();
  });
});
