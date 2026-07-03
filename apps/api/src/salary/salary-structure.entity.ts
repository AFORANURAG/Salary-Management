import type { ComponentKind } from "@salary-mgmt/types";
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { SalaryComponentEntity } from "./salary-component.entity";

@Entity({ name: "salary_structures" })
export class SalaryStructureEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index("idx_salary_structures_employee_id")
  @Column({ name: "employee_id", type: "uuid" })
  employeeId!: string;

  @Column({ name: "effective_from", type: "date" })
  effectiveFrom!: string;

  @Column({ name: "effective_to", type: "date", nullable: true })
  effectiveTo!: string | null;

  @Column({ type: "varchar", length: 3 })
  currency!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @OneToMany(() => SalaryComponentEntity, (c) => c.structure, {
    cascade: ["insert"],
    eager: false,
  })
  components!: SalaryComponentEntity[];
}
