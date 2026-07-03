import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateSalaryStructure1751100000000 implements MigrationInterface {
  name = "CreateSalaryStructure1751100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "salary_components_kind_enum" AS ENUM ('EARNING', 'DEDUCTION')`,
    );

    await queryRunner.createTable(
      new Table({
        name: "salary_structures",
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
          { name: "effective_from", type: "date" },
          { name: "effective_to", type: "date", isNullable: true },
          { name: "currency", type: "varchar", length: "3" },
          { name: "created_at", type: "timestamptz", default: "now()" },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: "salary_components",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          { name: "structure_id", type: "uuid" },
          { name: "code", type: "varchar", length: "64" },
          { name: "kind", type: "salary_components_kind_enum" },
          { name: "amount_minor", type: "integer" },
        ],
      }),
      true,
    );

    await queryRunner.createIndices("salary_structures", [
      new TableIndex({ name: "idx_salary_structures_employee_id", columnNames: ["employee_id"] }),
    ]);

    await queryRunner.createIndices("salary_components", [
      new TableIndex({ name: "idx_salary_components_structure_id", columnNames: ["structure_id"] }),
    ]);

    await queryRunner.createForeignKey(
      "salary_structures",
      new TableForeignKey({
        columnNames: ["employee_id"],
        referencedTableName: "employees",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    await queryRunner.createForeignKey(
      "salary_components",
      new TableForeignKey({
        columnNames: ["structure_id"],
        referencedTableName: "salary_structures",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("salary_components", true);
    await queryRunner.dropTable("salary_structures", true);
    await queryRunner.query(`DROP TYPE IF EXISTS "salary_components_kind_enum"`);
  }
}
