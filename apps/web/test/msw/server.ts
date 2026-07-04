import { setupServer } from "msw/node";
import { employeeHandlers } from "./handlers/employees";
import { salaryStructureHandlers } from "./handlers/salary-structure";
import { payrollHandlers } from "./handlers/payroll";

export const server = setupServer(...employeeHandlers, ...salaryStructureHandlers, ...payrollHandlers);
