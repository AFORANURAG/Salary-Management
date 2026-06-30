import { Module } from "@nestjs/common";
import { CommonModule } from "./common/common.module";
import { EmployeesModule } from "./employees/employees.module";
import { HealthModule } from "./health/health.module";
import { PayrollModule } from "./payroll/payroll.module";
import { PayslipsModule } from "./payslips/payslips.module";
import { ReportingModule } from "./reporting/reporting.module";
import { SalaryModule } from "./salary/salary.module";

@Module({
  imports: [
    HealthModule,
    CommonModule,
    EmployeesModule,
    SalaryModule,
    PayrollModule,
    PayslipsModule,
    ReportingModule,
  ],
})
export class AppModule {}
