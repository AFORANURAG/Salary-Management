import type { HrUserRole, HrUserStatus } from "@salary-mgmt/types";
import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "../common/base.entity";

export const HR_USER_ROLE_VALUES: readonly HrUserRole[] = [
  "ADMIN",
  "HR_MANAGER",
  "HR_VIEWER",
];

export const HR_USER_STATUS_VALUES: readonly HrUserStatus[] = [
  "PENDING_SETUP",
  "ACTIVE",
];

@Entity({ name: "hr_users" })
export class HrUserEntity extends BaseEntity {
  @Index("idx_hr_users_email", { unique: true })
  @Column({ type: "varchar", length: 255 })
  email!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({
    type: "enum",
    enum: HR_USER_ROLE_VALUES as string[],
    default: "HR_VIEWER",
  })
  role!: HrUserRole;

  @Column({ name: "password_hash", type: "varchar", length: 255, nullable: true })
  passwordHash!: string | null;

  @Index("idx_hr_users_invite_token", { unique: true })
  @Column({ name: "invite_token", type: "uuid", nullable: true })
  inviteToken!: string | null;

  @Column({ name: "invite_expires_at", type: "timestamptz", nullable: true })
  inviteExpiresAt!: Date | null;

  @Index("idx_hr_users_status")
  @Column({
    type: "enum",
    enum: HR_USER_STATUS_VALUES as string[],
    default: "PENDING_SETUP",
  })
  status!: HrUserStatus;
}
