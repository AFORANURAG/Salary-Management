import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateHrUsers1751400000000 implements MigrationInterface {
  name = "CreateHrUsers1751400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "hr_user_role_enum" AS ENUM ('ADMIN', 'HR_MANAGER', 'HR_VIEWER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "hr_user_status_enum" AS ENUM ('PENDING_SETUP', 'ACTIVE')`,
    );

    await queryRunner.createTable(
      new Table({
        name: "hr_users",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          { name: "email", type: "varchar", length: "255" },
          { name: "name", type: "varchar", length: "255" },
          {
            name: "role",
            type: "hr_user_role_enum",
            default: "'HR_VIEWER'",
          },
          { name: "password_hash", type: "varchar", length: "255", isNullable: true },
          { name: "invite_token", type: "uuid", isNullable: true },
          { name: "invite_expires_at", type: "timestamptz", isNullable: true },
          {
            name: "status",
            type: "hr_user_status_enum",
            default: "'PENDING_SETUP'",
          },
          { name: "created_at", type: "timestamptz", default: "now()" },
          { name: "updated_at", type: "timestamptz", default: "now()" },
        ],
      }),
      true,
    );

    await queryRunner.createIndices("hr_users", [
      new TableIndex({
        name: "idx_hr_users_email",
        columnNames: ["email"],
        isUnique: true,
      }),
      new TableIndex({
        name: "idx_hr_users_invite_token",
        columnNames: ["invite_token"],
        isUnique: true,
        where: "invite_token IS NOT NULL",
      }),
      new TableIndex({
        name: "idx_hr_users_status",
        columnNames: ["status"],
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("hr_users", true);
    await queryRunner.query(`DROP TYPE IF EXISTS "hr_user_role_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "hr_user_status_enum"`);
  }
}
