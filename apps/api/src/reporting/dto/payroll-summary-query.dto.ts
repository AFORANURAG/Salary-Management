import { Matches } from "class-validator";

export class PayrollSummaryQueryDto {
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: "period must be in YYYY-MM format (e.g. 2026-06)",
  })
  period!: string;
}
