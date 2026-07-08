import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

export type PayrollRunStatus = "PENDING" | "COMPLETED" | "VOIDED";

@Entity({ name: "payroll_runs" })
export class PayrollRunEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index("idx_payroll_runs_period", { unique: true })
  @Column({ type: "varchar", length: 7 })
  period!: string;

  @Column({ type: "enum", enum: ["PENDING", "COMPLETED", "VOIDED"], default: "PENDING" })
  status!: PayrollRunStatus;

  @Column({ name: "headcount", type: "integer", default: 0 })
  headcount!: number;

  @Column({ name: "total_gross_minor", type: "bigint", default: 0 })
  totalGrossMinor!: number;

  @Column({ name: "total_deductions_minor", type: "bigint", default: 0 })
  totalDeductionsMinor!: number;

  @Column({ name: "total_net_minor", type: "bigint", default: 0 })
  totalNetMinor!: number;

  @Column({ type: "varchar", length: 10, default: "USD" })
  currency!: string;

  @Column({ name: "ran_at", type: "timestamptz", nullable: true })
  ranAt!: Date | null;

  @Column({ name: "voided_at", type: "timestamptz", nullable: true })
  voidedAt!: Date | null;

  @Column({ name: "voided_by", type: "varchar", nullable: true })
  voidedBy!: string | null;
}
