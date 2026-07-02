import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";
import { describe, expect, it } from "vitest";
import { CreateEmployeeDto } from "./create-employee.dto";

function validateInput(input: Record<string, unknown>): string[] {
  const dto = plainToInstance(CreateEmployeeDto, input);
  return validateSync(dto as object, {
    whitelist: true,
    forbidNonWhitelisted: true,
  }).flatMap((e) => Object.keys(e.constraints ?? {}));
}

const validInput = {
  employeeCode: "EMP-000001",
  name: "Ada Lovelace",
  email: "ada@acme.example.com",
  department: "Engineering",
  designation: "Staff Engineer",
  country: "US",
  currency: "USD",
  joiningDate: "2022-01-15",
  employmentStatus: "ACTIVE",
  costCenter: "CC-100",
};

describe("CreateEmployeeDto", () => {
  it("accepts a fully valid payload", () => {
    expect(validateInput(validInput)).toHaveLength(0);
  });

  it("accepts a payload without the optional costCenter (nullable)", () => {
    const { costCenter, ...rest } = validInput;
    expect(validateInput({ ...rest, costCenter: null })).toHaveLength(0);
  });

  it("rejects a missing required name", () => {
    const { name, ...rest } = validInput;
    expect(validateInput(rest).length).toBeGreaterThan(0);
  });

  it("rejects a malformed email", () => {
    expect(validateInput({ ...validInput, email: "not-an-email" }).length).toBeGreaterThan(0);
  });

  it("rejects a country that is not a 2-letter ISO code", () => {
    expect(validateInput({ ...validInput, country: "USA" }).length).toBeGreaterThan(0);
  });

  it("rejects a currency that is not a 3-letter ISO code", () => {
    expect(validateInput({ ...validInput, currency: "US" }).length).toBeGreaterThan(0);
  });

  it("rejects an employmentStatus outside the enum", () => {
    expect(validateInput({ ...validInput, employmentStatus: "RETIRED" }).length).toBeGreaterThan(0);
  });

  it("rejects unknown fields (whitelist)", () => {
    expect(validateInput({ ...validInput, salaryMinor: 100000 }).length).toBeGreaterThan(0);
  });
});
