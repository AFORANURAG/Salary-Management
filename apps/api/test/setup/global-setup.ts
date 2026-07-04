import { Client } from "pg";
import { DataSource } from "typeorm";
import { EmployeeEntity } from "../../src/employees/employee.entity";
import { PayrollResultEntity } from "../../src/payroll/payroll-result.entity";
import { SalaryComponentEntity } from "../../src/salary/salary-component.entity";
import { SalaryStructureEntity } from "../../src/salary/salary-structure.entity";
import { CreateEmployees1751000000000 } from "../../src/database/migrations/1751000000000-CreateEmployees";
import { CreateSalaryStructure1751100000000 } from "../../src/database/migrations/1751100000000-CreateSalaryStructure";
import { AddSalaryStructureOpenVersionIndex1751200000000 } from "../../src/database/migrations/1751200000000-AddSalaryStructureOpenVersionIndex";
import { CreatePayrollResults1751300000000 } from "../../src/database/migrations/1751300000000-CreatePayrollResults";

const host = process.env.DB_HOST ?? "localhost";
const port = Number(process.env.DB_PORT ?? 5432);
const username = process.env.DB_USER ?? "salary";
const password = process.env.DB_PASSWORD ?? "salary";
const testDbName = process.env.TEST_DB_NAME ?? "salary_mgmt_test";

/**
 * Global setup: ensure a dedicated test database exists and is fully migrated.
 * Runs once before the whole suite. Keeps the dev database untouched.
 */
export async function setup(): Promise<void> {
  const admin = new Client({
    host,
    port,
    user: username,
    password,
    database: "postgres",
  });
  await admin.connect();
  const exists = await admin.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [testDbName],
  );
  if (exists.rowCount === 0) {
    await admin.query(`CREATE DATABASE "${testDbName}"`);
  }
  await admin.end();

  const dataSource = new DataSource({
    type: "postgres",
    host,
    port,
    username,
    password,
    database: testDbName,
    entities: [EmployeeEntity, SalaryStructureEntity, SalaryComponentEntity, PayrollResultEntity],
    migrations: [CreateEmployees1751000000000, CreateSalaryStructure1751100000000, AddSalaryStructureOpenVersionIndex1751200000000, CreatePayrollResults1751300000000],
    synchronize: false,
    logging: false,
  });
  await dataSource.initialize();
  await dataSource.runMigrations();
  await dataSource.destroy();
}
