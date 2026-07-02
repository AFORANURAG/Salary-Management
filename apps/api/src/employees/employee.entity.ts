import type { EmploymentStatus } from "@salary-mgmt/types";
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export const EMPLOYMENT_STATUS_VALUES: readonly EmploymentStatus[] = [
  "ACTIVE",
  "INACTIVE",
  "TERMINATED",
];

@Entity({ name: "employees" })
export class EmployeeEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index("idx_employees_employee_code", { unique: true })
  @Column({ name: "employee_code", type: "varchar", length: 64 })
  employeeCode!: string;

  @Index("idx_employees_name")
  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Index("idx_employees_email", { unique: true })
  @Column({ type: "varchar", length: 255 })
  email!: string;

  @Index("idx_employees_department")
  @Column({ type: "varchar", length: 128 })
  department!: string;

  @Column({ type: "varchar", length: 128 })
  designation!: string;

  @Index("idx_employees_country")
  @Column({ type: "varchar", length: 2 })
  country!: string;

  @Column({ type: "varchar", length: 3 })
  currency!: string;

  @Column({ name: "joining_date", type: "date" })
  joiningDate!: string;

  @Index("idx_employees_employment_status")
  @Column({
    name: "employment_status",
    type: "enum",
    enum: EMPLOYMENT_STATUS_VALUES as string[],
    default: "ACTIVE",
  })
  employmentStatus!: EmploymentStatus;

  @Column({ name: "cost_center", type: "varchar", length: 64, nullable: true })
  costCenter!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
