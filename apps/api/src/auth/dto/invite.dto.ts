import { IsEmail, IsEnum, IsString, MinLength } from "class-validator";
import type { HrUserRole } from "@salary-mgmt/types";

const ROLE_VALUES: HrUserRole[] = ["ADMIN", "HR_MANAGER", "HR_VIEWER"];

export class InviteDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsEnum(ROLE_VALUES)
  role!: HrUserRole;
}
