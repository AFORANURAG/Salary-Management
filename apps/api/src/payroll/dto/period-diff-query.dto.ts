import { IsNotEmpty, Matches } from "class-validator";

export class PeriodDiffQueryDto {
  @IsNotEmpty({ message: "compareTo is required" })
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: "compareTo must be in YYYY-MM format (e.g. 2026-05)",
  })
  compareTo!: string;
}
