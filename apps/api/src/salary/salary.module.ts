import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EmployeeEntity } from "../employees/employee.entity";
import { SalaryComponentEntity } from "./salary-component.entity";
import { SalaryStructureController } from "./salary-structure.controller";
import { SalaryStructureEntity } from "./salary-structure.entity";
import { SalaryStructureService } from "./salary-structure.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalaryStructureEntity,
      SalaryComponentEntity,
      EmployeeEntity,
    ]),
  ],
  controllers: [SalaryStructureController],
  providers: [SalaryStructureService],
})
export class SalaryModule {}
