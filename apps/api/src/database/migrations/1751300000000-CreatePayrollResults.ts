import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey, TableUnique } from "typeorm";

export class CreatePayrollResults1751300000000 implements MigrationInterface {
  name = "CreatePayrollResults1751300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "payroll_results",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          { name: "employee_id", type: "uuid" },
          { name: "period", type: "varchar", length: "7" },
          { name: "structure_id", type: "uuid" },
          { name: "gross_minor", type: "integer" },
          { name: "deductions_minor", type: "integer" },
          { name: "net_minor", type: "integer" },
          { name: "currency", type: "varchar", length: "3" },
          { name: "generated_at", type: "timestamptz", default: "now()" },
        ],
      }),
      true,
    );

    await queryRunner.createIndices("payroll_results", [
      new TableIndex({ name: "idx_payroll_results_employee_id", columnNames: ["employee_id"] }),
      new TableIndex({ name: "idx_payroll_results_period", columnNames: ["period"] }),
    ]);

    await queryRunner.createUniqueConstraint(
      "payroll_results",
      new TableUnique({
        name: "uq_payroll_results_employee_period",
        columnNames: ["employee_id", "period"],
      }),
    );

    await queryRunner.createForeignKeys("payroll_results", [
      new TableForeignKey({
        name: "fk_payroll_results_employee",
        columnNames: ["employee_id"],
        referencedTableName: "employees",
        referencedColumnNames: ["id"],
        onDelete: "RESTRICT",
      }),
      new TableForeignKey({
        name: "fk_payroll_results_structure",
        columnNames: ["structure_id"],
        referencedTableName: "salary_structures",
        referencedColumnNames: ["id"],
        onDelete: "RESTRICT",
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("payroll_results", true);
  }
}
