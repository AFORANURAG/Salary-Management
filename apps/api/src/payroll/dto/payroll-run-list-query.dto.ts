import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";
import { Transform } from "class-transformer";

const VALID_STATUSES = ["PENDING", "COMPLETED", "VOIDED"] as const;

export class PayrollRunListQueryDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    const n = Number(value);
    return Number.isNaN(n) ? 1 : n;
  })
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    const n = Number(value);
    return Number.isNaN(n) ? 20 : n;
  })
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize: number = 20;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    Array.isArray(value) ? value : value ? [value] : undefined,
  )
  @IsIn(VALID_STATUSES, { each: true })
  status?: string[];
}
