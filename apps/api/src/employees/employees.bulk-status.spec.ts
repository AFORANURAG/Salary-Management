import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EmployeesService } from "./employees.service";
import { EmployeeEntity } from "./employee.entity";

function makeRepo() {
  return {
    createQueryBuilder: vi.fn(),
    findOne: vi.fn(),
    save: vi.fn(),
    create: vi.fn(),
  };
}

describe("EmployeesService.bulkUpdateStatus()", () => {
  let service: EmployeesService;
  let repo: ReturnType<typeof makeRepo>;

  beforeEach(async () => {
    repo = makeRepo();
    const mod = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: getRepositoryToken(EmployeeEntity), useValue: repo },
      ],
    }).compile();
    service = mod.get(EmployeesService);
  });

  it("updates matching rows and returns correct updated count", async () => {
    const ids = ["id-1", "id-2", "id-3"];
    const executeUpdate = vi.fn().mockResolvedValue({ affected: 3 });
    const qb: Record<string, unknown> = {};
    qb.update = vi.fn().mockReturnValue(qb);
    qb.set = vi.fn().mockReturnValue(qb);
    qb.where = vi.fn().mockReturnValue(qb);
    qb.setParameter = vi.fn().mockReturnValue(qb);
    qb.execute = executeUpdate;
    repo.createQueryBuilder.mockReturnValue(qb);

    const result = await service.bulkUpdateStatus(ids, "INACTIVE");

    expect(result.updated).toBe(3);
    expect(result.skipped).toBe(0);
  });

  it("returns skipped count when some IDs don't exist", async () => {
    const ids = ["id-1", "id-2", "id-3", "id-unknown"];
    const executeUpdate = vi.fn().mockResolvedValue({ affected: 3 });
    const qb: Record<string, unknown> = {};
    qb.update = vi.fn().mockReturnValue(qb);
    qb.set = vi.fn().mockReturnValue(qb);
    qb.where = vi.fn().mockReturnValue(qb);
    qb.setParameter = vi.fn().mockReturnValue(qb);
    qb.execute = executeUpdate;
    repo.createQueryBuilder.mockReturnValue(qb);

    const result = await service.bulkUpdateStatus(ids, "INACTIVE");

    expect(result.updated).toBe(3);
    expect(result.skipped).toBe(1);
  });

  it("uses a single UPDATE query (createQueryBuilder called once)", async () => {
    const ids = ["id-1", "id-2"];
    const qb: Record<string, unknown> = {};
    qb.update = vi.fn().mockReturnValue(qb);
    qb.set = vi.fn().mockReturnValue(qb);
    qb.where = vi.fn().mockReturnValue(qb);
    qb.setParameter = vi.fn().mockReturnValue(qb);
    qb.execute = vi.fn().mockResolvedValue({ affected: 2 });
    repo.createQueryBuilder.mockReturnValue(qb);

    await service.bulkUpdateStatus(ids, "TERMINATED");

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(qb.execute).toHaveBeenCalledTimes(1);
  });

  it("returns { updated: 0, skipped: N } when all IDs are unknown", async () => {
    const ids = ["ghost-1", "ghost-2"];
    const qb: Record<string, unknown> = {};
    qb.update = vi.fn().mockReturnValue(qb);
    qb.set = vi.fn().mockReturnValue(qb);
    qb.where = vi.fn().mockReturnValue(qb);
    qb.setParameter = vi.fn().mockReturnValue(qb);
    qb.execute = vi.fn().mockResolvedValue({ affected: 0 });
    repo.createQueryBuilder.mockReturnValue(qb);

    const result = await service.bulkUpdateStatus(ids, "ACTIVE");

    expect(result.updated).toBe(0);
    expect(result.skipped).toBe(2);
  });
});
