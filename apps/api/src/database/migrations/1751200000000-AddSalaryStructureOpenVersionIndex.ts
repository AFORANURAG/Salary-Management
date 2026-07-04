import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSalaryStructureOpenVersionIndex1751200000000
  implements MigrationInterface
{
  name = "AddSalaryStructureOpenVersionIndex1751200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_salary_structures_one_open_per_employee"
       ON "salary_structures" ("employee_id")
       WHERE "effective_to" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_salary_structures_one_open_per_employee"`,
    );
  }
}
