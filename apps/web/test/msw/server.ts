import { setupServer } from "msw/node";
import { employeeHandlers } from "./handlers/employees";
import { salaryStructureHandlers } from "./handlers/salary-structure";

export const server = setupServer(...employeeHandlers, ...salaryStructureHandlers);
