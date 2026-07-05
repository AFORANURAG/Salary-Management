import { IsIn, Matches } from "class-validator";
import type { GroupByDimension } from "@salary-mgmt/types";

const GROUP_BY_VALUES: GroupByDimension[] = ["department", "country", "costCenter"];

export class PayrollCostQueryDto {
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: "period must be in YYYY-MM format (e.g. 2026-06)",
  })
  period!: string;

  @IsIn(GROUP_BY_VALUES, {
    message: `groupBy must be one of: ${GROUP_BY_VALUES.join(", ")}`,
  })
  groupBy!: GroupByDimension;
}
