import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { SalaryStructure } from "@salary-mgmt/types";
import { Repository } from "typeorm";
import { EmployeeEntity } from "../employees/employee.entity";
import { SalaryComponentEntity } from "./salary-component.entity";
import { SalaryStructureEntity } from "./salary-structure.entity";
import type { UpsertSalaryStructureDto } from "./dto/upsert-salary-structure.dto";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Returns effectiveTo for the version being superseded: one day before newEffectiveFrom. */
export function closeVersion(newEffectiveFrom: string): string {
  const d = new Date(`${newEffectiveFrom}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Finds the version whose [effectiveFrom, effectiveTo] range contains the given date. */
export function resolveActiveVersion<
  T extends { effectiveFrom: string; effectiveTo: string | null },
>(versions: T[], date: string): T | undefined {
  return versions.find(
    (v) =>
      v.effectiveFrom <= date &&
      (v.effectiveTo === null || v.effectiveTo >= date),
  );
}

@Injectable()
export class SalaryStructureService {
  constructor(
    @InjectRepository(SalaryStructureEntity)
    private readonly structureRepo: Repository<SalaryStructureEntity>,
    @InjectRepository(SalaryComponentEntity)
    private readonly componentRepo: Repository<SalaryComponentEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepo: Repository<EmployeeEntity>,
  ) {}

  async upsert(
    employeeId: string,
    dto: UpsertSalaryStructureDto,
  ): Promise<SalaryStructure> {
    await this.assertEmployeeExists(employeeId);

    return this.structureRepo.manager.transaction(async (em) => {
      const structureRepo = em.getRepository(SalaryStructureEntity);
      const componentRepo = em.getRepository(SalaryComponentEntity);

      // Find the current open version
      const current = await structureRepo.findOne({
        where: { employeeId, effectiveTo: null as unknown as string },
        relations: ["components"],
      });

      if (current) {
        if (dto.effectiveFrom <= current.effectiveFrom) {
          throw new ConflictException(
            "effectiveFrom must be after the current version's effectiveFrom",
          );
        }
        current.effectiveTo = closeVersion(dto.effectiveFrom);
        await structureRepo.save(current);
      }

      const structure = structureRepo.create({
        employeeId,
        effectiveFrom: dto.effectiveFrom,
        effectiveTo: null,
        currency: dto.currency,
      });
      const saved = await structureRepo.save(structure);

      const components = dto.components.map((c) =>
        componentRepo.create({
          structureId: saved.id,
          code: c.code,
          kind: c.kind,
          amountMinor: c.amountMinor,
        }),
      );
      const savedComponents = await componentRepo.save(components);

      return toResponse(saved, savedComponents);
    });
  }

  async findCurrent(employeeId: string): Promise<SalaryStructure> {
    await this.assertEmployeeExists(employeeId);

    const structure = await this.structureRepo.findOne({
      where: { employeeId, effectiveTo: null as unknown as string },
      relations: ["components"],
    });

    if (!structure) {
      throw new NotFoundException(
        `No active salary structure for employee ${employeeId}`,
      );
    }
    return toResponse(structure, structure.components);
  }

  async findHistory(employeeId: string): Promise<SalaryStructure[]> {
    await this.assertEmployeeExists(employeeId);

    const structures = await this.structureRepo.find({
      where: { employeeId },
      relations: ["components"],
      order: { effectiveFrom: "ASC" },
    });

    return structures.map((s) => toResponse(s, s.components));
  }

  private async assertEmployeeExists(employeeId: string): Promise<void> {
    if (!UUID_RE.test(employeeId)) {
      throw new NotFoundException(`Employee ${employeeId} not found`);
    }
    const exists = await this.employeeRepo.existsBy({ id: employeeId });
    if (!exists) {
      throw new NotFoundException(`Employee ${employeeId} not found`);
    }
  }
}

function toResponse(
  s: SalaryStructureEntity,
  components: SalaryComponentEntity[],
): SalaryStructure {
  return {
    id: s.id,
    employeeId: s.employeeId,
    effectiveFrom: s.effectiveFrom,
    effectiveTo: s.effectiveTo,
    currency: s.currency,
    createdAt: s.createdAt.toISOString(),
    components: components.map((c) => ({
      id: c.id,
      structureId: c.structureId,
      code: c.code,
      kind: c.kind,
      amountMinor: c.amountMinor,
    })),
  };
}
