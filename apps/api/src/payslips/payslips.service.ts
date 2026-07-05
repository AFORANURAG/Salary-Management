import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Payslip, PayslipLineItem, PayslipSummary } from "@salary-mgmt/types";
import { Repository } from "typeorm";
import { EmployeeEntity } from "../employees/employee.entity";
import { PayrollResultEntity } from "../payroll/payroll-result.entity";
import { SalaryComponentEntity } from "../salary/salary-component.entity";

export function buildPayslip(
  employee: Pick<EmployeeEntity, "id" | "employeeCode" | "name" | "department" | "country">,
  result: Pick<
    PayrollResultEntity,
    "period" | "grossMinor" | "deductionsMinor" | "netMinor" | "currency" | "generatedAt"
  >,
  components: Pick<SalaryComponentEntity, "code" | "kind" | "amountMinor">[],
): Payslip {
  const lineItems: PayslipLineItem[] = components.map((c) => ({
    code: c.code,
    kind: c.kind,
    amountMinor: c.amountMinor,
  }));

  return {
    period: result.period,
    generatedAt: result.generatedAt instanceof Date
      ? result.generatedAt.toISOString()
      : String(result.generatedAt),
    employeeId: employee.id,
    employeeCode: employee.employeeCode,
    name: employee.name,
    department: employee.department,
    country: employee.country,
    currency: result.currency,
    lineItems,
    grossMinor: result.grossMinor,
    deductionsMinor: result.deductionsMinor,
    netMinor: result.netMinor,
  };
}

@Injectable()
export class PayslipsService {
  constructor(
    @InjectRepository(PayrollResultEntity)
    private readonly payrollRepo: Repository<PayrollResultEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepo: Repository<EmployeeEntity>,
    @InjectRepository(SalaryComponentEntity)
    private readonly componentRepo: Repository<SalaryComponentEntity>,
  ) {}

  async getHistory(employeeId: string): Promise<PayslipSummary[]> {
    await this.assertEmployeeExists(employeeId);

    const results = await this.payrollRepo.find({
      where: { employeeId },
      order: { period: "DESC" },
    });

    return results.map((r) => ({
      period: r.period,
      grossMinor: r.grossMinor,
      deductionsMinor: r.deductionsMinor,
      netMinor: r.netMinor,
      currency: r.currency,
      generatedAt: r.generatedAt instanceof Date
        ? r.generatedAt.toISOString()
        : String(r.generatedAt),
    }));
  }

  async getPayslip(employeeId: string, period: string): Promise<Payslip> {
    const employee = await this.employeeRepo.findOne({ where: { id: employeeId } });
    if (!employee) throw new NotFoundException(`Employee ${employeeId} not found`);

    const result = await this.payrollRepo.findOne({ where: { employeeId, period } });
    if (!result) {
      throw new NotFoundException(
        `No payroll result for employee ${employeeId} in period ${period}`,
      );
    }

    const components = await this.componentRepo.find({
      where: { structureId: result.structureId },
    });

    return buildPayslip(employee, result, components);
  }

  private async assertEmployeeExists(employeeId: string): Promise<void> {
    const exists = await this.employeeRepo.findOne({ where: { id: employeeId } });
    if (!exists) throw new NotFoundException(`Employee ${employeeId} not found`);
  }
}
