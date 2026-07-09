import type { MigrationInterface, QueryRunner } from "typeorm";

export class ExpandPayrollRunCurrency1751600000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payroll_runs" ALTER COLUMN "currency" TYPE varchar(10)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payroll_runs" ALTER COLUMN "currency" TYPE varchar(3)`,
    );
  }
}
