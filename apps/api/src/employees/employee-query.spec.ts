import { describe, expect, it } from "vitest";
import { parseEmployeeListQuery } from "./employee-query";

describe("parseEmployeeListQuery", () => {
  it("applies defaults: page 1, pageSize 25, sort name:asc", () => {
    const q = parseEmployeeListQuery({});
    expect(q.page).toBe(1);
    expect(q.pageSize).toBe(25);
    expect(q.sortField).toBe("name");
    expect(q.sortDirection).toBe("asc");
    expect(q.department).toEqual([]);
    expect(q.country).toEqual([]);
    expect(q.status).toEqual([]);
  });

  it("clamps pageSize above the max of 100", () => {
    expect(parseEmployeeListQuery({ pageSize: "500" }).pageSize).toBe(100);
  });

  it("parses a valid pageSize within range", () => {
    expect(parseEmployeeListQuery({ pageSize: "50" }).pageSize).toBe(50);
  });

  it("rejects a page below 1", () => {
    expect(() => parseEmployeeListQuery({ page: "0" })).toThrow();
  });

  it("parses a valid sort field and direction", () => {
    const q = parseEmployeeListQuery({ sort: "joiningDate:desc" });
    expect(q.sortField).toBe("joiningDate");
    expect(q.sortDirection).toBe("desc");
  });

  it("rejects an unknown sort field", () => {
    expect(() => parseEmployeeListQuery({ sort: "salary:asc" })).toThrow();
  });

  it("rejects an invalid sort direction", () => {
    expect(() => parseEmployeeListQuery({ sort: "name:sideways" })).toThrow();
  });

  it("normalizes a single filter value into an array", () => {
    expect(parseEmployeeListQuery({ department: "Engineering" }).department).toEqual([
      "Engineering",
    ]);
  });

  it("preserves repeated filter values as an array", () => {
    expect(parseEmployeeListQuery({ country: ["US", "IN"] }).country).toEqual(["US", "IN"]);
  });

  it("only accepts valid employment statuses in the status filter", () => {
    expect(parseEmployeeListQuery({ status: ["ACTIVE", "INACTIVE"] }).status).toEqual([
      "ACTIVE",
      "INACTIVE",
    ]);
  });
});
