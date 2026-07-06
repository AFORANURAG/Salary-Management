import { setupServer } from "msw/node";
import { authHandlers } from "./handlers/auth";
import { employeeHandlers } from "./handlers/employees";
import { salaryStructureHandlers } from "./handlers/salary-structure";
import { payrollHandlers } from "./handlers/payroll";
import { payslipHandlers } from "./handlers/payslips";
import { reportingHandlers } from "./handlers/reporting";

export const server = setupServer(...authHandlers, ...employeeHandlers, ...salaryStructureHandlers, ...payrollHandlers, ...payslipHandlers, ...reportingHandlers);
