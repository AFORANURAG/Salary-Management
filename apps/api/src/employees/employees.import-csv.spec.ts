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
    create: vi.fn((data: unknown) => data),
    manager: {
      transaction: vi.fn(async (cb: (em: unknown) => Promise<unknown>) => cb({ save: vi.fn().mockImplementation((e: unknown) => e) })),
    },
  };
}

const VALID_HEADER = "employeeCode,name,email,department,designation,country,currency,joiningDate,employmentStatus";

function makeValidRow(n: number) {
  return `EMP-CSV-${n},Name ${n},csv${n}@acme.example.com,Engineering,Engineer,US,USD,2023-01-15,ACTIVE`;
}

function makeBuffer(rows: string[]) {
  return Buffer.from([VALID_HEADER, ...rows].join("\n"));
}

describe("EmployeesService.importFromCsv()", () => {
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

  it("imports all valid rows and returns imported count with empty failed array", async () => {
    const buf = makeBuffer([makeValidRow(1), makeValidRow(2), makeValidRow(3)]);
    repo.findOne.mockResolvedValue(null);

    const result = await service.importFromCsv(buf);

    expect(result.imported).toBe(3);
    expect(result.failed).toHaveLength(0);
  });

  it("collects invalid rows with per-field errors without throwing", async () => {
    const invalidRow = "BAD,,not-an-email,INVALID_DEPT,Engineer,XX,USD,not-a-date,ACTIVE";
    const buf = makeBuffer([makeValidRow(1), invalidRow]);
    repo.findOne.mockResolvedValue(null);

    const result = await service.importFromCsv(buf);

    expect(result.imported).toBe(1);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].row).toBe(2);
    expect(result.failed[0].errors.length).toBeGreaterThan(0);
  });

  it("reports duplicate email as a row error, not a thrown exception", async () => {
    const buf = makeBuffer([makeValidRow(1)]);
    repo.findOne.mockResolvedValue({ id: "existing-id" });

    const result = await service.importFromCsv(buf);

    expect(result.imported).toBe(0);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].errors.some((e) => /email|duplicate/i.test(e))).toBe(true);
  });

  it("parses columns in any order (order-independent header)", async () => {
    const shuffledHeader = "name,employeeCode,joiningDate,currency,country,designation,department,email,employmentStatus";
    const row = "Name X,EMP-CSV-99,2023-06-01,USD,US,Engineer,Engineering,csvx@acme.example.com,ACTIVE";
    const buf = Buffer.from([shuffledHeader, row].join("\n"));
    repo.findOne.mockResolvedValue(null);

    const result = await service.importFromCsv(buf);

    expect(result.imported).toBe(1);
    expect(result.failed).toHaveLength(0);
  });

  it("returns 400-style error for an empty buffer", async () => {
    const buf = Buffer.from("");
    await expect(service.importFromCsv(buf)).rejects.toThrow();
  });

  it("returns 400-style error when header row is missing", async () => {
    const buf = Buffer.from(makeValidRow(1));
    await expect(service.importFromCsv(buf)).rejects.toThrow();
  });
});
