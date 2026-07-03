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

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  employeeCode?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsIn([...DEPARTMENTS])
  department?: Department;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  designation?: string;

  @IsOptional()
  @IsISO31661Alpha2()
  country?: string;

  @IsOptional()
  @IsISO4217CurrencyCode()
  currency?: string;

  @IsOptional()
  @IsDateString()
  joiningDate?: string;

  @IsOptional()
  @IsIn(EMPLOYMENT_STATUSES)
  employmentStatus?: EmploymentStatus;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(64)
  costCenter?: string | null;
}
