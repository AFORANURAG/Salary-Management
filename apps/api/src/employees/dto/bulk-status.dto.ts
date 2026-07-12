import type { EmploymentStatus } from "@salary-mgmt/types";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsUUID } from "class-validator";

const EMPLOYMENT_STATUSES: EmploymentStatus[] = ["ACTIVE", "INACTIVE", "TERMINATED"];

export class BulkStatusDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @IsUUID("4", { each: true })
  ids!: string[];

  @IsIn(EMPLOYMENT_STATUSES)
  status!: EmploymentStatus;
}
