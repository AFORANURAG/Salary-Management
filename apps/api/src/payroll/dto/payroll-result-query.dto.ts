import { IsOptional, IsUUID } from "class-validator";

export class PayrollResultQueryDto {
  @IsOptional()
  @IsUUID()
  employeeId?: string;
}
