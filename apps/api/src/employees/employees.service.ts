import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type {
  BulkStatusResponse,
  Employee,
  EmploymentStatus,
  ImportFailedRow,
  ImportResponse,
  PaginatedResponse,
} from "@salary-mgmt/types";
import { parse } from "csv-parse/sync";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { QueryFailedError, Repository } from "typeorm";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import type { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { EmployeeEntity } from "./employee.entity";
import {
  parseEmployeeListQuery,
  type RawEmployeeQuery,
} from "./employee-query";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PG_UNIQUE_VIOLATION = "23505";

function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof QueryFailedError &&
    (err as QueryFailedError & { driverError?: { code?: string } }).driverError
      ?.code === PG_UNIQUE_VIOLATION
  );
}

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly repo: Repository<EmployeeEntity>,
  ) {}

  async create(dto: CreateEmployeeDto): Promise<Employee> {
    const entity = this.repo.create({
      ...dto,
      employmentStatus: dto.employmentStatus ?? "ACTIVE",
      costCenter: dto.costCenter ?? null,
    });
    try {
      const saved = await this.repo.save(entity);
      return toResponse(saved);
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictException("employeeCode or email already exists");
      }
      throw err;
    }
  }

  async findOne(id: string): Promise<Employee> {
    const entity = await this.findEntityOrThrow(id);
    return toResponse(entity);
  }

  async update(id: string, dto: UpdateEmployeeDto): Promise<Employee> {
    const entity = await this.findEntityOrThrow(id);
    Object.assign(entity, dto);
    try {
      const saved = await this.repo.save(entity);
      return toResponse(saved);
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictException("employeeCode or email already exists");
      }
      throw err;
    }
  }

  async softDelete(id: string): Promise<Employee> {
    const entity = await this.findEntityOrThrow(id);
    entity.employmentStatus = "TERMINATED";
    const saved = await this.repo.save(entity);
    return toResponse(saved);
  }

  async list(raw: RawEmployeeQuery): Promise<PaginatedResponse<Employee>> {
    const query = parseEmployeeListQuery(raw);
    const qb = this.repo.createQueryBuilder("e");

    if (query.q) {
      qb.andWhere(
        "(e.name ILIKE :q OR e.employee_code ILIKE :q OR e.email ILIKE :q)",
        { q: `%${query.q}%` },
      );
    }
    if (query.department.length > 0) {
      qb.andWhere("e.department IN (:...departments)", {
        departments: query.department,
      });
    }
    if (query.country.length > 0) {
      qb.andWhere("e.country IN (:...countries)", { countries: query.country });
    }
    if (query.status.length > 0) {
      qb.andWhere("e.employment_status IN (:...statuses)", {
        statuses: query.status,
      });
    }

    qb.orderBy(`e.${query.sortField}`, query.sortDirection === "asc" ? "ASC" : "DESC")
      .addOrderBy("e.id", "ASC")
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize);

    const [rows, total] = await qb.getManyAndCount();
    return {
      data: rows.map(toResponse),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }

  async bulkUpdateStatus(
    ids: string[],
    status: EmploymentStatus,
  ): Promise<BulkStatusResponse> {
    const result = await this.repo
      .createQueryBuilder()
      .update(EmployeeEntity)
      .set({ employmentStatus: status })
      .where("id = ANY(:ids)", { ids })
      .execute();

    const updated = result.affected ?? 0;
    const skipped = ids.length - updated;
    return { updated, skipped };
  }

  async importFromCsv(buffer: Buffer): Promise<ImportResponse> {
    if (!buffer.length) {
      throw new BadRequestException("CSV file is empty");
    }

    let rows: Record<string, string>[];
    try {
      rows = parse(buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: false,
      }) as Record<string, string>[];
    } catch {
      throw new BadRequestException("Invalid CSV format");
    }

    const REQUIRED_COLUMNS = [
      "employeeCode",
      "name",
      "email",
      "department",
      "designation",
      "country",
      "currency",
      "joiningDate",
      "employmentStatus",
    ];

    if (rows.length === 0) {
      throw new BadRequestException("CSV has no data rows");
    }

    const headers = Object.keys(rows[0]!);
    const missingCols = REQUIRED_COLUMNS.filter((c) => !headers.includes(c));
    if (missingCols.length > 0) {
      throw new BadRequestException(
        `Missing required CSV columns: ${missingCols.join(", ")}`,
      );
    }

    const failed: ImportFailedRow[] = [];
    const validDtos: CreateEmployeeDto[] = [];
    const validRowIndices: number[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const dto = plainToInstance(CreateEmployeeDto, row, {
        enableImplicitConversion: true,
      });
      const errors = await validate(dto, {
        whitelist: true,
        forbidNonWhitelisted: false,
      });

      if (errors.length > 0) {
        failed.push({
          row: i + 1,
          employeeCode: row.employeeCode ?? null,
          errors: errors.flatMap((e) => Object.values(e.constraints ?? {})),
        });
      } else {
        validDtos.push(dto);
        validRowIndices.push(i + 1);
      }
    }

    // Check for duplicate emails against existing DB records
    const emailsToCheck = validDtos.map((d) => d.email);
    const existingByEmail = emailsToCheck.length
      ? await this.repo
          .createQueryBuilder("e")
          .where("e.email = ANY(:emails)", { emails: emailsToCheck })
          .getMany()
      : [];
    const existingEmails = new Set(existingByEmail.map((e) => e.email.toLowerCase()));

    const insertable: CreateEmployeeDto[] = [];
    for (let i = 0; i < validDtos.length; i++) {
      const dto = validDtos[i]!;
      if (existingEmails.has(dto.email.toLowerCase())) {
        failed.push({
          row: validRowIndices[i]!,
          employeeCode: dto.employeeCode,
          errors: [`email '${dto.email}' already exists`],
        });
      } else {
        insertable.push(dto);
      }
    }

    if (insertable.length > 0) {
      await this.repo.manager.transaction(async (em) => {
        for (const dto of insertable) {
          const entity = em.create(EmployeeEntity, {
            ...dto,
            employmentStatus: dto.employmentStatus ?? "ACTIVE",
            costCenter: dto.costCenter ?? null,
          });
          await em.save(entity);
        }
      });
    }

    return { imported: insertable.length, failed };
  }

  private async findEntityOrThrow(id: string): Promise<EmployeeEntity> {
    if (!UUID_RE.test(id)) {
      throw new NotFoundException(`Employee ${id} not found`);
    }
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Employee ${id} not found`);
    }
    return entity;
  }
}

function toResponse(e: EmployeeEntity): Employee {
  return {
    id: e.id,
    employeeCode: e.employeeCode,
    name: e.name,
    email: e.email,
    department: e.department,
    designation: e.designation,
    country: e.country,
    currency: e.currency,
    joiningDate: e.joiningDate,
    employmentStatus: e.employmentStatus,
    costCenter: e.costCenter,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}
