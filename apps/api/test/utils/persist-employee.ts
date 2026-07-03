import type { CreateEmployeeInput } from "@salary-mgmt/types";
import { EmployeeEntity } from "../../src/employees/employee.entity";
import { buildEmployeeInput } from "./employee-factory";
import { initTestDataSource } from "./test-data-source";

/** Insert an employee row directly (Arrange step for read/update/list tests). */
export async function persistEmployee(
  overrides: Partial<CreateEmployeeInput> = {},
): Promise<EmployeeEntity> {
  const ds = await initTestDataSource();
  const repo = ds.getRepository(EmployeeEntity);
  const input = buildEmployeeInput(overrides);
  const entity = repo.create({
    ...input,
    employmentStatus: input.employmentStatus ?? "ACTIVE",
    costCenter: input.costCenter ?? null,
  });
  return repo.save(entity);
}

const BATCH_SIZE = 500;

/** Insert many employees in chunked batches to stay within Postgres param limits. */
export async function persistEmployees(
  count: number,
  overrides: (i: number) => Partial<CreateEmployeeInput> = () => ({}),
): Promise<void> {
  const ds = await initTestDataSource();
  const repo = ds.getRepository(EmployeeEntity);
  const rows = Array.from({ length: count }, (_, i) => {
    const input = buildEmployeeInput(overrides(i));
    return repo.create({
      ...input,
      employmentStatus: input.employmentStatus ?? "ACTIVE",
      costCenter: input.costCenter ?? null,
    });
  });
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    await repo.insert(rows.slice(i, i + BATCH_SIZE));
  }
}
