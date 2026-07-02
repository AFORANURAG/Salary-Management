import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EmployeeEntity } from "./employee.entity";
import { EmployeesController } from "./employees.controller";
import { EmployeesService } from "./employees.service";

/** Employee module — domain owned by specs/employees.md. */
@Module({
  imports: [TypeOrmModule.forFeature([EmployeeEntity])],
  controllers: [EmployeesController],
  providers: [EmployeesService],
})
export class EmployeesModule {}
