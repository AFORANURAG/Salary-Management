import { Controller, Get, Query } from "@nestjs/common";
import type { PayrollCostResponse, PayrollSummaryResponse } from "@salary-mgmt/types";
import { PayrollCostQueryDto } from "./dto/payroll-cost-query.dto";
import { PayrollSummaryQueryDto } from "./dto/payroll-summary-query.dto";
import { ReportingService } from "./reporting.service";

@Controller("reporting")
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get("payroll-cost")
  getPayrollCost(
    @Query() query: PayrollCostQueryDto,
  ): Promise<PayrollCostResponse> {
    return this.reportingService.getPayrollCost(query.period, query.groupBy);
  }

  @Get("payroll-summary")
  getPayrollSummary(
    @Query() query: PayrollSummaryQueryDto,
  ): Promise<PayrollSummaryResponse> {
    return this.reportingService.getPayrollSummary(query.period);
  }
}
