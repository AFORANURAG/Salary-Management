import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EmployeeEntity } from "../employees/employee.entity";
import { PayrollResultEntity } from "../payroll/payroll-result.entity";

@Injectable()
export class ReportingService {
  constructor(
    @InjectRepository(PayrollResultEntity)
    private readonly payrollResultRepo: Repository<PayrollResultEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepo: Repository<EmployeeEntity>,
  ) {}
}
