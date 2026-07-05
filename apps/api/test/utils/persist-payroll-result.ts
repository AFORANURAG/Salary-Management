import { PayrollResultEntity } from "../../src/payroll/payroll-result.entity";
import { initTestDataSource } from "./test-data-source";

interface PersistPayrollResultInput {
  employeeId: string;
  structureId: string;
  period: string;
  grossMinor: number;
  deductionsMinor: number;
  netMinor: number;
  currency: string;
}

export async function persistPayrollResult(
  input: PersistPayrollResultInput,
): Promise<PayrollResultEntity> {
  const ds = await initTestDataSource();
  const repo = ds.getRepository(PayrollResultEntity);
  const entity = repo.create(input);
  return repo.save(entity);
}
