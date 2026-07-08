import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import type {
  PaginatedResponse,
  PayrollDiffResponse,
  PayrollResult,
  PayrollRunSummary,
} from "@salary-mgmt/types";
import { CurrentUser } from "../auth/current-user.decorator";
import type { HrUserEntity } from "../hr-users/hr-user.entity";
import { Roles } from "../auth/roles.decorator";
import { PayrollResultQueryDto } from "./dto/payroll-result-query.dto";
import { PayrollRunListQueryDto } from "./dto/payroll-run-list-query.dto";
import { PeriodDiffQueryDto } from "./dto/period-diff-query.dto";
import { RunPayrollDto } from "./dto/run-payroll.dto";
import { PayrollService } from "./payroll.service";

@Controller("payroll")
export class PayrollController {
  constructor(private readonly service: PayrollService) {}

  @Post("runs")
  @HttpCode(201)
  @Roles("ADMIN", "HR_MANAGER")
  run(@Body() dto: RunPayrollDto): Promise<PayrollRunSummary> {
    return this.service.run(dto.period);
  }

  @Get("runs")
  listRuns(@Query() query: PayrollRunListQueryDto): Promise<PaginatedResponse<PayrollRunSummary>> {
    return this.service.listRuns(query.page, query.pageSize, query.status);
  }

  @Get("runs/:period")
  findSummary(@Param("period") period: string): Promise<PayrollRunSummary> {
    return this.service.findSummary(period);
  }

  @Get("runs/:period/results")
  findResults(
    @Param("period") period: string,
    @Query() query: PayrollResultQueryDto,
  ): Promise<PayrollResult[]> {
    return this.service.findResults(period, query);
  }

  @Post("runs/:period/void")
  @HttpCode(200)
  @Roles("ADMIN")
  voidRun(
    @Param("period") period: string,
    @CurrentUser() actor: HrUserEntity,
  ): Promise<PayrollRunSummary> {
    return this.service.voidRun(period, actor.email);
  }

  @Get("runs/:period/diff")
  getDiff(
    @Param("period") period: string,
    @Query() query: PeriodDiffQueryDto,
  ): Promise<PayrollDiffResponse> {
    return this.service.getDiff(period, query.compareTo);
  }
}
