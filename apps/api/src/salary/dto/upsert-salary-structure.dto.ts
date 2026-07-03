import type { ComponentKind } from "@salary-mgmt/types";
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsISO4217CurrencyCode,
  IsInt,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

const COMPONENT_KINDS: ComponentKind[] = ["EARNING", "DEDUCTION"];

export class ComponentDto {
  @IsString()
  @Matches(/^[A-Z][A-Z0-9_]*$/, { message: "code must be SCREAMING_SNAKE_CASE" })
  code!: string;

  @IsIn(COMPONENT_KINDS)
  kind!: ComponentKind;

  @IsInt()
  @Min(0)
  amountMinor!: number;
}

export class UpsertSalaryStructureDto {
  @IsDateString()
  effectiveFrom!: string;

  @IsISO4217CurrencyCode()
  currency!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ComponentDto)
  components!: ComponentDto[];
}
