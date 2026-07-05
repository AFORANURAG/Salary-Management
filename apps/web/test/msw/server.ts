import { setupServer } from "msw/node";
import { employeeHandlers } from "./handlers/employees";
import { salaryStructureHandlers } from "./handlers/salary-structure";
import { payrollHandlers } from "./handlers/payroll";
import { payslipHandlers } from "./handlers/payslips";
import { reportingHandlers } from "./handlers/reporting";

export const server = setupServer(...employeeHandlers, ...salaryStructureHandlers, ...payrollHandlers, ...payslipHandlers, ...reportingHandlers);
