import type { PayrollRunStatus } from "../../src/payroll/payroll-run.entity";
import { PayrollRunEntity } from "../../src/payroll/payroll-run.entity";
import { TestDataSource } from "./test-data-source";

interface PersistPayrollRunInput {
  period: string;
  status?: PayrollRunStatus;
  headcount?: number;
  totalGrossMinor?: number;
  totalDeductionsMinor?: number;
  totalNetMinor?: number;
  currency?: string;
  ranAt?: Date | null;
  voidedAt?: Date | null;
  voidedBy?: string | null;
}

export async function persistPayrollRun(
  input: PersistPayrollRunInput,
): Promise<PayrollRunEntity> {
  const repo = TestDataSource.getRepository(PayrollRunEntity);
  const entity = repo.create({
    status: "COMPLETED",
    headcount: 0,
    totalGrossMinor: 0,
    totalDeductionsMinor: 0,
    totalNetMinor: 0,
    currency: "USD",
    ranAt: new Date(),
    voidedAt: null,
    voidedBy: null,
    ...input,
  });
  return repo.save(entity);
}
