import { DEPARTMENTS, type Department, type EmploymentStatus } from "@salary-mgmt/types";
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsISO31661Alpha2,
  IsISO4217CurrencyCode,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from "class-validator";

const EMPLOYMENT_STATUSES: EmploymentStatus[] = [
  "ACTIVE",
  "INACTIVE",
  "TERMINATED",
];

export class CreateEmployeeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  employeeCode!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsIn([...DEPARTMENTS])
  department!: Department;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  designation!: string;

  @IsISO31661Alpha2()
  country!: string;

  @IsISO4217CurrencyCode()
  currency!: string;

  @IsDateString()
  joiningDate!: string;

  @IsOptional()
  @IsIn(EMPLOYMENT_STATUSES)
  employmentStatus?: EmploymentStatus;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(64)
  costCenter?: string | null;
}
