import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  PayloadTooLargeException,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type {
  BulkStatusResponse,
  Employee,
  ImportResponse,
  PaginatedResponse,
} from "@salary-mgmt/types";
import { Roles } from "../auth/roles.decorator";
import { BulkStatusDto } from "./dto/bulk-status.dto";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import type { RawEmployeeQuery } from "./employee-query";
import { EmployeesService } from "./employees.service";

const TWO_MB = 2 * 1024 * 1024;

@Controller("employees")
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Post()
  @Roles("ADMIN", "HR_MANAGER")
  create(@Body() dto: CreateEmployeeDto): Promise<Employee> {
    return this.employees.create(dto);
  }

  // Registered before /:id to avoid route collision
  @Post("bulk-status")
  @HttpCode(HttpStatus.OK)
  @Roles("ADMIN", "HR_MANAGER")
  bulkStatus(@Body() dto: BulkStatusDto): Promise<BulkStatusResponse> {
    return this.employees.bulkUpdateStatus(dto.ids, dto.status);
  }

  @Post("import")
  @HttpCode(HttpStatus.CREATED)
  @Roles("ADMIN", "HR_MANAGER")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: TWO_MB } }))
  async importCsv(
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<ImportResponse> {
    if (!file) {
      throw new BadRequestException("file is required");
    }
    if (file.size > TWO_MB) {
      throw new PayloadTooLargeException("File exceeds 2 MB limit");
    }
    const mime = file.mimetype ?? "";
    if (!mime.includes("csv") && !file.originalname.endsWith(".csv")) {
      throw new BadRequestException("Only .csv files are accepted");
    }
    return this.employees.importFromCsv(file.buffer);
  }

  @Get()
  list(@Query() query: RawEmployeeQuery): Promise<PaginatedResponse<Employee>> {
    return this.employees.list(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string): Promise<Employee> {
    return this.employees.findOne(id);
  }

  @Patch(":id")
  @Roles("ADMIN", "HR_MANAGER")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateEmployeeDto,
  ): Promise<Employee> {
    return this.employees.update(id, dto);
  }

  @Delete(":id")
  @Roles("ADMIN", "HR_MANAGER")
  remove(@Param("id") id: string): Promise<Employee> {
    return this.employees.softDelete(id);
  }
}
