import { faker } from "@faker-js/faker";
import type { CreateEmployeeInput, EmploymentStatus } from "@salary-mgmt/types";

const DEPARTMENTS = ["Engineering", "Sales", "Finance", "HR", "Operations"];
const COUNTRIES = ["US", "IN", "GB", "DE", "SG"];
const CURRENCIES = ["USD", "INR", "GBP", "EUR", "SGD"];

let counter = 0;

/** Build a valid CreateEmployeeInput payload; override any field as needed. */
export function buildEmployeeInput(
  overrides: Partial<CreateEmployeeInput> = {},
): CreateEmployeeInput {
  counter += 1;
  const idx = faker.number.int({ min: 0, max: COUNTRIES.length - 1 });
  return {
    employeeCode: `EMP-${String(counter).padStart(6, "0")}`,
    name: faker.person.fullName(),
    email: faker.internet
      .email({ provider: `acme-${counter}.example.com` })
      .toLowerCase(),
    department: faker.helpers.arrayElement(DEPARTMENTS),
    designation: faker.person.jobTitle(),
    country: COUNTRIES[idx],
    currency: CURRENCIES[idx],
    joiningDate: faker.date
      .past({ years: 5 })
      .toISOString()
      .slice(0, 10),
    employmentStatus: "ACTIVE" satisfies EmploymentStatus,
    ...overrides,
  };
}
