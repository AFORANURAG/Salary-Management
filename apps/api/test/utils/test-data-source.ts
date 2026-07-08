import { DataSource } from "typeorm";
import { EmployeeEntity } from "../../src/employees/employee.entity";
import { HrUserEntity } from "../../src/hr-users/hr-user.entity";
import { PayrollResultEntity } from "../../src/payroll/payroll-result.entity";
import { PayrollRunEntity } from "../../src/payroll/payroll-run.entity";
import { SalaryComponentEntity } from "../../src/salary/salary-component.entity";
import { SalaryStructureEntity } from "../../src/salary/salary-structure.entity";

const host = process.env.DB_HOST ?? "localhost";
const port = Number(process.env.DB_PORT ?? 5432);
const username = process.env.DB_USER ?? "salary";
const password = process.env.DB_PASSWORD ?? "salary";
const database = process.env.DB_NAME ?? "salary_mgmt_test";

/**
 * Shared DataSource for tests that need direct DB access (seeding fixtures,
 * truncation). Migrations are applied by global-setup; this only connects.
 * Entities are referenced by class (not glob) so the SWC transform applies —
 * globbed `.entity.ts` paths would be require()'d raw by TypeORM and fail to
 * parse decorators.
 */
export const TestDataSource = new DataSource({
  type: "postgres",
  host,
  port,
  username,
  password,
  database,
  entities: [EmployeeEntity, HrUserEntity, SalaryStructureEntity, SalaryComponentEntity, PayrollResultEntity, PayrollRunEntity],
  synchronize: false,
  logging: false,
});

export async function initTestDataSource(): Promise<DataSource> {
  if (!TestDataSource.isInitialized) {
    await TestDataSource.initialize();
  }
  return TestDataSource;
}

export async function destroyTestDataSource(): Promise<void> {
  if (TestDataSource.isInitialized) {
    await TestDataSource.destroy();
  }
}

/** Truncate all domain tables (not the migrations table) for test isolation. */
export async function truncateAll(): Promise<void> {
  const ds = await initTestDataSource();
  // Order respects FK constraints: payroll_results → components → structures → employees
  await ds.query(
    'TRUNCATE TABLE "payroll_runs", "payroll_results", "salary_components", "salary_structures", "employees", "hr_users" RESTART IDENTITY CASCADE',
  );
}
