import type { HrUserRole } from "@salary-mgmt/types";
import { TestDataSource } from "./test-data-source";
import { HrUserEntity } from "../../src/hr-users/hr-user.entity";

let counter = 0;

export function buildHrUserInput(
  overrides: Partial<{
    email: string;
    name: string;
    role: HrUserRole;
    passwordHash: string | null;
    inviteToken: string | null;
    inviteExpiresAt: Date | null;
    status: "PENDING_SETUP" | "ACTIVE";
  }> = {},
) {
  counter++;
  return {
    email: `hr-user-${counter}@acme-test.example.com`,
    name: `HR User ${counter}`,
    role: "HR_VIEWER" as HrUserRole,
    passwordHash: null,
    inviteToken: null,
    inviteExpiresAt: null,
    status: "PENDING_SETUP" as const,
    ...overrides,
  };
}

export async function persistHrUser(
  overrides: Partial<Parameters<typeof buildHrUserInput>[0]> = {},
): Promise<HrUserEntity> {
  const repo = TestDataSource.getRepository(HrUserEntity);
  const data = buildHrUserInput(overrides);
  const entity = repo.create(data);
  return repo.save(entity);
}

export async function persistActiveAdmin(overrides: { email?: string; password?: string } = {}): Promise<HrUserEntity> {
  const bcrypt = await import("bcrypt");
  const hash = await bcrypt.hash(overrides.password ?? "Test1234!", 1);
  return persistHrUser({
    email: overrides.email ?? "admin@acme-test.example.com",
    name: "Test Admin",
    role: "ADMIN",
    passwordHash: hash,
    status: "ACTIVE",
  });
}
