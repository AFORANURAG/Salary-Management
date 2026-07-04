import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { ComponentKind, PayrollResult, PayrollRunSummary } from "@salary-mgmt/types";
import { Repository } from "typeorm";
import { EmployeeEntity } from "../employees/employee.entity";
import { SalaryComponentEntity } from "../salary/salary-component.entity";
import { SalaryStructureEntity } from "../salary/salary-structure.entity";
import { PayrollResultEntity } from "./payroll-result.entity";
import type { PayrollResultQueryDto } from "./dto/payroll-result-query.dto";

// ---------------------------------------------------------------------------
// Pure helpers (exported for unit tests)
// ---------------------------------------------------------------------------

export function computePayroll(
  components: { kind: ComponentKind; amountMinor: number }[],
): { grossMinor: number; deductionsMinor: number; netMinor: number } {
  let grossMinor = 0;
  let deductionsMinor = 0;
  for (const c of components) {
    if (c.kind === "EARNING") {
      grossMinor += c.amountMinor;
    } else {
      deductionsMinor += c.amountMinor;
    }
  }
  return { grossMinor, deductionsMinor, netMinor: grossMinor - deductionsMinor };
}

export function resolvePeriodStructure<
  T extends { effectiveFrom: string; effectiveTo: string | null },
>(versions: T[], period: string): T | null {
  // Period start is YYYY-MM-01; compare as ISO date strings (lexicographic = chronological)
  const periodStart = `${period}-01`;
  const match = versions.find(
    (v) =>
      v.effectiveFrom <= periodStart &&
      (v.effectiveTo === null || v.effectiveTo >= periodStart),
  );
  return match ?? null;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class PayrollService {
  constructor(
    @InjectRepository(PayrollResultEntity)
    private readonly payrollRepo: Repository<PayrollResultEntity>,
    @InjectRepository(SalaryStructureEntity)
    private readonly structureRepo: Repository<SalaryStructureEntity>,
    @InjectRepository(SalaryComponentEntity)
    private readonly componentRepo: Repository<SalaryComponentEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepo: Repository<EmployeeEntity>,
  ) {}

  async run(period: string): Promise<PayrollRunSummary> {
    // Hard 409 if any results already exist for this period
    const existingCount = await this.payrollRepo.count({ where: { period } });
    if (existingCount > 0) {
      throw new ConflictException(`Payroll already run for period ${period}`);
    }

    const employees = await this.employeeRepo.find();

    const structures = await this.structureRepo.find({
      where: employees.map((e) => ({ employeeId: e.id })),
      relations: ["components"],
    });

    // Group all structure versions by employeeId
    const byEmployee = new Map<string, SalaryStructureEntity[]>();
    for (const s of structures) {
      const list = byEmployee.get(s.employeeId) ?? [];
      list.push(s);
      byEmployee.set(s.employeeId, list);
    }

    const results: Omit<PayrollResultEntity, "id" | "generatedAt" | "employee" | "structure">[] = [];
    const skipped: string[] = [];

    for (const emp of employees) {
      const versions = byEmployee.get(emp.id) ?? [];
      const activeStructure = resolvePeriodStructure(versions, period);

      if (!activeStructure) {
        skipped.push(emp.id);
        continue;
      }

      const { grossMinor, deductionsMinor, netMinor } = computePayroll(
        activeStructure.components,
      );

      results.push({
        employeeId: emp.id,
        period,
        structureId: activeStructure.id,
        grossMinor,
        deductionsMinor,
        netMinor,
        currency: activeStructure.currency,
      });
    }

    // Bulk insert — ON CONFLICT DO NOTHING to avoid race conditions
    if (results.length > 0) {
      await this.payrollRepo
        .createQueryBuilder()
        .insert()
        .into(PayrollResultEntity)
        .values(results)
        .orIgnore()
        .execute();
    }

    const totalGrossMinor = results.reduce((s, r) => s + r.grossMinor, 0);
    const totalNetMinor = results.reduce((s, r) => s + r.netMinor, 0);

    return {
      period,
      processed: results.length,
      skipped,
      totalGrossMinor,
      totalNetMinor,
    };
  }

  async findSummary(period: string): Promise<PayrollRunSummary> {
    const rows = await this.payrollRepo.find({ where: { period } });
    if (rows.length === 0) {
      throw new NotFoundException(`No payroll run found for period ${period}`);
    }

    const totalGrossMinor = rows.reduce((s, r) => s + r.grossMinor, 0);
    const totalNetMinor = rows.reduce((s, r) => s + r.netMinor, 0);

    return {
      period,
      processed: rows.length,
      skipped: [],
      totalGrossMinor,
      totalNetMinor,
    };
  }

  async findResults(
    period: string,
    query: PayrollResultQueryDto,
  ): Promise<PayrollResult[]> {
    const where: { period: string; employeeId?: string } = { period };
    if (query.employeeId) {
      where.employeeId = query.employeeId;
    }

    const rows = await this.payrollRepo.find({ where });
    return rows.map(toResponse);
  }
}

function toResponse(r: PayrollResultEntity): PayrollResult {
  return {
    id: r.id,
    employeeId: r.employeeId,
    period: r.period,
    structureId: r.structureId,
    grossMinor: r.grossMinor,
    deductionsMinor: r.deductionsMinor,
    netMinor: r.netMinor,
    currency: r.currency,
    generatedAt: r.generatedAt.toISOString(),
  };
}
