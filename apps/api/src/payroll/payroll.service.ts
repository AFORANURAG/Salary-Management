import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type {
  ComponentKind,
  PayrollResult,
  PayrollRunSummary,
} from "@salary-mgmt/types";
import { Repository } from "typeorm";
import { EmployeeEntity } from "../employees/employee.entity";
import { SalaryComponentEntity } from "../salary/salary-component.entity";
import { SalaryStructureEntity } from "../salary/salary-structure.entity";
import { PayrollResultEntity } from "./payroll-result.entity";
import { PayrollRunEntity } from "./payroll-run.entity";
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
    @InjectRepository(PayrollRunEntity)
    private readonly runRepo: Repository<PayrollRunEntity>,
    @InjectRepository(SalaryStructureEntity)
    private readonly structureRepo: Repository<SalaryStructureEntity>,
    @InjectRepository(SalaryComponentEntity)
    private readonly componentRepo: Repository<SalaryComponentEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepo: Repository<EmployeeEntity>,
  ) {}

  async run(period: string): Promise<PayrollRunSummary> {
    const existingRun = await this.runRepo.findOne({ where: { period } });
    if (existingRun) {
      throw new ConflictException(`Payroll already run for period ${period}`);
    }

    // Create PENDING run record
    const run = this.runRepo.create({ period, status: "PENDING" });
    await this.runRepo.save(run);

    const employees = await this.employeeRepo.find();

    const structures = await this.structureRepo.find({
      relations: ["components"],
    });

    const byEmployee = new Map<string, SalaryStructureEntity[]>();
    for (const s of structures) {
      const list = byEmployee.get(s.employeeId) ?? [];
      list.push(s);
      byEmployee.set(s.employeeId, list);
    }

    const results: Omit<PayrollResultEntity, "id" | "generatedAt" | "employee" | "structure">[] = [];
    const currencies = new Set<string>();

    for (const emp of employees) {
      const versions = byEmployee.get(emp.id) ?? [];
      const activeStructure = resolvePeriodStructure(versions, period);

      if (!activeStructure) continue;

      const { grossMinor, deductionsMinor, netMinor } = computePayroll(
        activeStructure.components,
      );

      currencies.add(activeStructure.currency);
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

    // Chunked bulk insert (Postgres bind-param limit: 65535; 7 cols × 500 = 3500/chunk)
    const INSERT_CHUNK = 500;
    for (let i = 0; i < results.length; i += INSERT_CHUNK) {
      await this.payrollRepo
        .createQueryBuilder()
        .insert()
        .into(PayrollResultEntity)
        .values(results.slice(i, i + INSERT_CHUNK))
        .orIgnore()
        .execute();
    }

    const totalGrossMinor = results.reduce((s, r) => s + r.grossMinor, 0);
    const totalDeductionsMinor = results.reduce((s, r) => s + r.deductionsMinor, 0);
    const totalNetMinor = results.reduce((s, r) => s + r.netMinor, 0);
    const currency = currencies.size === 1 ? [...currencies][0]! : "MIXED";

    // Update run to COMPLETED
    run.status = "COMPLETED";
    run.headcount = results.length;
    run.totalGrossMinor = totalGrossMinor;
    run.totalDeductionsMinor = totalDeductionsMinor;
    run.totalNetMinor = totalNetMinor;
    run.currency = currency;
    run.ranAt = new Date();
    await this.runRepo.save(run);

    return toRunSummary(run);
  }

  async findSummary(period: string): Promise<PayrollRunSummary> {
    const run = await this.runRepo.findOne({ where: { period } });
    if (!run) {
      throw new NotFoundException(`No payroll run found for period ${period}`);
    }
    return toRunSummary(run);
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
    return rows.map(toResultResponse);
  }
}

function toRunSummary(run: PayrollRunEntity): PayrollRunSummary {
  return {
    period: run.period,
    status: run.status,
    headcount: run.headcount,
    totalGrossMinor: Number(run.totalGrossMinor),
    totalDeductionsMinor: Number(run.totalDeductionsMinor),
    totalNetMinor: Number(run.totalNetMinor),
    currency: run.currency,
    ranAt: run.ranAt?.toISOString() ?? null,
    voidedAt: run.voidedAt?.toISOString() ?? null,
    voidedBy: run.voidedBy,
  };
}

function toResultResponse(r: PayrollResultEntity): PayrollResult {
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
