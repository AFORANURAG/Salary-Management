import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateEmployees1751000000000 implements MigrationInterface {
  name = "CreateEmployees1751000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TYPE "employees_employment_status_enum" AS ENUM ('ACTIVE', 'INACTIVE', 'TERMINATED')`,
    );

    await queryRunner.createTable(
      new Table({
        name: "employees",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          { name: "employee_code", type: "varchar", length: "64" },
          { name: "name", type: "varchar", length: "255" },
          { name: "email", type: "varchar", length: "255" },
          { name: "department", type: "varchar", length: "128" },
          { name: "designation", type: "varchar", length: "128" },
          { name: "country", type: "varchar", length: "2" },
          { name: "currency", type: "varchar", length: "3" },
          { name: "joining_date", type: "date" },
          {
            name: "employment_status",
            type: "employees_employment_status_enum",
            default: "'ACTIVE'",
          },
          { name: "cost_center", type: "varchar", length: "64", isNullable: true },
          {
            name: "created_at",
            type: "timestamptz",
            default: "now()",
          },
          {
            name: "updated_at",
            type: "timestamptz",
            default: "now()",
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndices("employees", [
      new TableIndex({
        name: "idx_employees_employee_code",
        columnNames: ["employee_code"],
        isUnique: true,
      }),
      new TableIndex({
        name: "idx_employees_email",
        columnNames: ["email"],
        isUnique: true,
      }),
      new TableIndex({ name: "idx_employees_name", columnNames: ["name"] }),
      new TableIndex({
        name: "idx_employees_department",
        columnNames: ["department"],
      }),
      new TableIndex({ name: "idx_employees_country", columnNames: ["country"] }),
      new TableIndex({
        name: "idx_employees_employment_status",
        columnNames: ["employment_status"],
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("employees", true);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "employees_employment_status_enum"`,
    );
  }
}
