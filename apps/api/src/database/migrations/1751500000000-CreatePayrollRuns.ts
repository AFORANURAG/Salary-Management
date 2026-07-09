import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreatePayrollRuns1751500000000 implements MigrationInterface {
  name = "CreatePayrollRuns1751500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "payroll_run_status_enum" AS ENUM ('PENDING', 'COMPLETED', 'VOIDED')`,
    );

    await queryRunner.createTable(
      new Table({
        name: "payroll_runs",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          { name: "period", type: "varchar", length: "7", isUnique: true },
          {
            name: "status",
            type: "payroll_run_status_enum",
            default: "'PENDING'",
          },
          { name: "headcount", type: "integer", default: "0" },
          { name: "total_gross_minor", type: "bigint", default: "0" },
          { name: "total_deductions_minor", type: "bigint", default: "0" },
          { name: "total_net_minor", type: "bigint", default: "0" },
          { name: "currency", type: "varchar", length: "3", default: "'USD'" },
          { name: "ran_at", type: "timestamptz", isNullable: true },
          { name: "voided_at", type: "timestamptz", isNullable: true },
          { name: "voided_by", type: "varchar", isNullable: true },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("payroll_runs", true);
    await queryRunner.query(`DROP TYPE IF EXISTS "payroll_run_status_enum"`);
  }
}
