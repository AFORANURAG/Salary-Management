import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EmployeeEntity } from "../employees/employee.entity";
import { SalaryComponentEntity } from "../salary/salary-component.entity";
import { SalaryStructureEntity } from "../salary/salary-structure.entity";
import { PayrollResultEntity } from "./payroll-result.entity";
import { PayrollRunEntity } from "./payroll-run.entity";
import { PayrollController } from "./payroll.controller";
import { PayrollService } from "./payroll.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PayrollResultEntity,
      PayrollRunEntity,
      SalaryStructureEntity,
      SalaryComponentEntity,
      EmployeeEntity,
    ]),
  ],
  controllers: [PayrollController],
  providers: [PayrollService],
})
export class PayrollModule {}
