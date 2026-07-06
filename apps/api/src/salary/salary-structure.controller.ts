import { Body, Controller, Get, Param, Put, Res } from "@nestjs/common";
import type { SalaryStructure } from "@salary-mgmt/types";
import { Roles } from "../auth/roles.decorator";
import { UpsertSalaryStructureDto } from "./dto/upsert-salary-structure.dto";
import { SalaryStructureService } from "./salary-structure.service";

interface HttpResponse {
  status(code: number): this;
}

@Controller("employees/:employeeId/salary-structure")
export class SalaryStructureController {
  constructor(private readonly service: SalaryStructureService) {}

  @Put()
  @Roles("ADMIN", "HR_MANAGER")
  async upsert(
    @Param("employeeId") employeeId: string,
    @Body() dto: UpsertSalaryStructureDto,
    @Res({ passthrough: true }) res: HttpResponse,
  ): Promise<SalaryStructure> {
    const { structure, created } = await this.service.upsert(employeeId, dto);
    res.status(created ? 201 : 200);
    return structure;
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
