import { IsString, IsUUID, MinLength } from "class-validator";

export class SetupDto {
  @IsUUID()
  token!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
