import type { ComponentKind } from "@salary-mgmt/types";
import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { SalaryStructureEntity } from "./salary-structure.entity";

export const COMPONENT_KIND_VALUES: readonly ComponentKind[] = [
  "EARNING",
  "DEDUCTION",
];

@Entity({ name: "salary_components" })
export class SalaryComponentEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index("idx_salary_components_structure_id")
  @Column({ name: "structure_id", type: "uuid" })
  structureId!: string;

  @Column({ type: "varchar", length: 64 })
  code!: string;

  @Column({
    type: "enum",
    enum: COMPONENT_KIND_VALUES as string[],
  })
  kind!: ComponentKind;

  @Column({ name: "amount_minor", type: "integer" })
  amountMinor!: number;

  @ManyToOne(() => SalaryStructureEntity, (s) => s.components, {
    onDelete: "CASCADE",
  })
  structure!: SalaryStructureEntity;
}
