import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import type { PayrollResult, PayrollRunSummary } from "@salary-mgmt/types";
import { PayrollResultQueryDto } from "./dto/payroll-result-query.dto";
import { RunPayrollDto } from "./dto/run-payroll.dto";
import { PayrollService } from "./payroll.service";

@Controller("payroll")
export class PayrollController {
  constructor(private readonly service: PayrollService) {}

  @Post("runs")
  @HttpCode(201)
  run(@Body() dto: RunPayrollDto): Promise<PayrollRunSummary> {
    return this.service.run(dto.period);
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
}
