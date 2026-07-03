import { Body, Controller, Get, Param, Put, HttpCode } from "@nestjs/common";
import type { SalaryStructure } from "@salary-mgmt/types";
import { UpsertSalaryStructureDto } from "./dto/upsert-salary-structure.dto";
import { SalaryStructureService } from "./salary-structure.service";

@Controller("employees/:employeeId/salary-structure")
export class SalaryStructureController {
  constructor(private readonly service: SalaryStructureService) {}

  @Put()
  @HttpCode(201)
  upsert(
    @Param("employeeId") employeeId: string,
    @Body() dto: UpsertSalaryStructureDto,
  ): Promise<SalaryStructure> {
    return this.service.upsert(employeeId, dto);
  }

  @Get()
  findCurrent(
    @Param("employeeId") employeeId: string,
  ): Promise<SalaryStructure> {
    return this.service.findCurrent(employeeId);
  }

  @Get("history")
  findHistory(
    @Param("employeeId") employeeId: string,
  ): Promise<SalaryStructure[]> {
    return this.service.findHistory(employeeId);
  }
}
