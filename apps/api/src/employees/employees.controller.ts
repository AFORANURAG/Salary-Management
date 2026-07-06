import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import type { Employee, PaginatedResponse } from "@salary-mgmt/types";
import { Roles } from "../auth/roles.decorator";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import type { RawEmployeeQuery } from "./employee-query";
import { EmployeesService } from "./employees.service";

@Controller("employees")
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Post()
  @Roles("ADMIN", "HR_MANAGER")
  create(@Body() dto: CreateEmployeeDto): Promise<Employee> {
    return this.employees.create(dto);
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
