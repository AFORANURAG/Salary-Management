import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Employee, PaginatedResponse } from "@salary-mgmt/types";
import { QueryFailedError, Repository } from "typeorm";
import type { CreateEmployeeDto } from "./dto/create-employee.dto";
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
