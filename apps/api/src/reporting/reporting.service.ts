import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type {
  GroupByDimension,
  PayrollCostBucket,
  PayrollCostGroup,
  PayrollCostResponse,
  PayrollSummaryBucket,
  PayrollSummaryResponse,
} from "@salary-mgmt/types";
import { Repository } from "typeorm";
import { EmployeeEntity } from "../employees/employee.entity";
import { PayrollResultEntity } from "../payroll/payroll-result.entity";

// ---------------------------------------------------------------------------
// Column name mapping: GroupByDimension → employee column
// ---------------------------------------------------------------------------

const DIMENSION_COLUMN: Record<GroupByDimension, string> = {
  department: "e.department",
  country: "e.country",
  costCenter: "e.cost_center",
};

// ---------------------------------------------------------------------------
// Pure builders (exported for unit testing)
// ---------------------------------------------------------------------------

interface RawCostRow {
  key: string;
  currency: string;
  headcount: string;
  grossMinor: string;
  deductionsMinor: string;
  netMinor: string;
}

interface RawSummaryRow {
  currency: string;
  headcount: string;
  grossMinor: string;
  deductionsMinor: string;
  netMinor: string;
}

export function buildCostResponse(
  period: string,
  groupBy: GroupByDimension,
  rows: RawCostRow[],
): PayrollCostResponse {
  const bucketMap = new Map<string, PayrollCostGroup[]>();

  for (const row of rows) {
    const group: PayrollCostGroup = {
      key: row.key,
      headcount: Number(row.headcount),
      grossMinor: Number(row.grossMinor),
      deductionsMinor: Number(row.deductionsMinor),
      netMinor: Number(row.netMinor),
    };
    const existing = bucketMap.get(row.currency) ?? [];
    existing.push(group);
    bucketMap.set(row.currency, existing);
  }

  const buckets: PayrollCostBucket[] = Array.from(bucketMap.entries()).map(
    ([currency, groups]) => ({ currency, groups }),
  );

  return { period, groupBy, buckets };
}

export function buildSummaryResponse(
  period: string,
  rows: RawSummaryRow[],
): PayrollSummaryResponse {
  const buckets: PayrollSummaryBucket[] = rows.map((row) => ({
    currency: row.currency,
    headcount: Number(row.headcount),
    grossMinor: Number(row.grossMinor),
    deductionsMinor: Number(row.deductionsMinor),
    netMinor: Number(row.netMinor),
  }));

  return { period, buckets };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class ReportingService {
  constructor(
    @InjectRepository(PayrollResultEntity)
    private readonly payrollResultRepo: Repository<PayrollResultEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepo: Repository<EmployeeEntity>,
  ) {}

  async getPayrollCost(
    period: string,
    groupBy: GroupByDimension,
  ): Promise<PayrollCostResponse> {
    const dimensionCol = DIMENSION_COLUMN[groupBy];

    const qb = this.payrollResultRepo
      .createQueryBuilder("pr")
      .innerJoin(EmployeeEntity, "e", "e.id = pr.employee_id")
      .select(dimensionCol, "key")
      .addSelect("pr.currency", "currency")
      .addSelect("COUNT(*)", "headcount")
      .addSelect("SUM(pr.gross_minor)", "grossMinor")
      .addSelect("SUM(pr.deductions_minor)", "deductionsMinor")
      .addSelect("SUM(pr.net_minor)", "netMinor")
      .where("pr.period = :period", { period })
      .groupBy(dimensionCol)
      .addGroupBy("pr.currency")
      .orderBy(dimensionCol, "ASC");

    // Exclude rows where the grouping column is NULL (e.g. costCenter)
    if (groupBy === "costCenter") {
      qb.andWhere("e.cost_center IS NOT NULL");
    }

    const rows: RawCostRow[] = await qb.getRawMany();
    return buildCostResponse(period, groupBy, rows);
  }

  async getPayrollSummary(period: string): Promise<PayrollSummaryResponse> {
    const rows: RawSummaryRow[] = await this.payrollResultRepo
      .createQueryBuilder("pr")
      .select("pr.currency", "currency")
      .addSelect("COUNT(*)", "headcount")
      .addSelect("SUM(pr.gross_minor)", "grossMinor")
      .addSelect("SUM(pr.deductions_minor)", "deductionsMinor")
      .addSelect("SUM(pr.net_minor)", "netMinor")
      .where("pr.period = :period", { period })
      .groupBy("pr.currency")
      .orderBy("pr.currency", "ASC")
      .getRawMany();

    return buildSummaryResponse(period, rows);
  }
}
