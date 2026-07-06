import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AuthModule } from "./auth/auth.module";
import { JwtAuthGuard } from "./auth/jwt-auth.guard";
import { RolesGuard } from "./auth/roles.guard";
import { CommonModule } from "./common/common.module";
import { DatabaseModule } from "./database/database.module";
import { EmployeesModule } from "./employees/employees.module";
import { HealthModule } from "./health/health.module";
import { HrUsersModule } from "./hr-users/hr-users.module";
import { PayrollModule } from "./payroll/payroll.module";
import { PayslipsModule } from "./payslips/payslips.module";
import { ReportingModule } from "./reporting/reporting.module";
import { SalaryModule } from "./salary/salary.module";

@Module({
  imports: [
    HealthModule,
    DatabaseModule,
    CommonModule,
    AuthModule,
    HrUsersModule,
    EmployeesModule,
    SalaryModule,
    PayrollModule,
    PayslipsModule,
    ReportingModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
