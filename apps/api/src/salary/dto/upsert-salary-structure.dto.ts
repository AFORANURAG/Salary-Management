import type { ComponentKind } from "@salary-mgmt/types";
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsISO4217CurrencyCode,
  IsInt,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { COMPONENT_KIND_VALUES } from "../salary-component.entity";

export class ComponentDto {
  @IsString()
  @Matches(/^[A-Z][A-Z0-9_]*$/, { message: "code must be SCREAMING_SNAKE_CASE" })
  code!: string;

  @IsIn(COMPONENT_KIND_VALUES)
  kind!: ComponentKind;

  @IsInt()
  @Min(0)
  amountMinor!: number;
}

export class UpsertSalaryStructureDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "effectiveFrom must be a date in YYYY-MM-DD format" })
  effectiveFrom!: string;

  @IsISO4217CurrencyCode()
  currency!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ComponentDto)
  components!: ComponentDto[];
}
