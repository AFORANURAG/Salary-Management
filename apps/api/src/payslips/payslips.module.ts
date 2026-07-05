import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EmployeeEntity } from "../employees/employee.entity";
import { PayrollResultEntity } from "../payroll/payroll-result.entity";
import { SalaryComponentEntity } from "../salary/salary-component.entity";
import { SalaryStructureEntity } from "../salary/salary-structure.entity";
import { PayslipsController } from "./payslips.controller";
import { PayslipsService } from "./payslips.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PayrollResultEntity,
      SalaryStructureEntity,
      SalaryComponentEntity,
      EmployeeEntity,
    ]),
  ],
  controllers: [PayslipsController],
  providers: [PayslipsService],
})
export class PayslipsModule {}
