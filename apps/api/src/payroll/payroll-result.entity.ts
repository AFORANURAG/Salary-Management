import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { EmployeeEntity } from "../employees/employee.entity";
import { SalaryStructureEntity } from "../salary/salary-structure.entity";

@Entity({ name: "payroll_results" })
@Unique("uq_payroll_results_employee_period", ["employeeId", "period"])
export class PayrollResultEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index("idx_payroll_results_employee_id")
  @Column({ name: "employee_id", type: "uuid" })
  employeeId!: string;

  @Index("idx_payroll_results_period")
  @Column({ type: "varchar", length: 7 })
  period!: string;

  @Column({ name: "structure_id", type: "uuid" })
  structureId!: string;

  @Column({ name: "gross_minor", type: "integer" })
  grossMinor!: number;

  @Column({ name: "deductions_minor", type: "integer" })
  deductionsMinor!: number;

  @Column({ name: "net_minor", type: "integer" })
  netMinor!: number;

  @Column({ type: "varchar", length: 3 })
  currency!: string;

  @CreateDateColumn({ name: "generated_at", type: "timestamptz" })
  generatedAt!: Date;

  @ManyToOne(() => EmployeeEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "employee_id" })
  employee!: EmployeeEntity;

  @ManyToOne(() => SalaryStructureEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "structure_id" })
  structure!: SalaryStructureEntity;
}
