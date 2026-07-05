import { Controller, Get, Param } from "@nestjs/common";
import type { Payslip, PayslipSummary } from "@salary-mgmt/types";
import { PayslipsService } from "./payslips.service";

@Controller("employees/:employeeId/payslips")
export class PayslipsController {
  constructor(private readonly payslipsService: PayslipsService) {}

  @Get()
  getHistory(@Param("employeeId") employeeId: string): Promise<PayslipSummary[]> {
    return this.payslipsService.getHistory(employeeId);
  }

  @Get(":period")
  getPayslip(
    @Param("employeeId") employeeId: string,
    @Param("period") period: string,
  ): Promise<Payslip> {
    return this.payslipsService.getPayslip(employeeId, period);
  }
}
