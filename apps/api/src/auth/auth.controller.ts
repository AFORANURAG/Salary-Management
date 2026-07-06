import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { HrUserEntity } from "../hr-users/hr-user.entity";
import { AuthService } from "./auth.service";
import { CurrentUser } from "./current-user.decorator";
import { InviteDto } from "./dto/invite.dto";
import { LoginDto } from "./dto/login.dto";
import { SetupDto } from "./dto/setup.dto";
import { Public } from "./public.decorator";
import { Roles } from "./roles.decorator";

const COOKIE_NAME = "hrms_session";
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 8 * 60 * 60 * 1000,
};

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("invite")
  @Roles("ADMIN")
  async invite(
    @Body() dto: InviteDto,
    @CurrentUser() actor: HrUserEntity,
  ) {
    return this.authService.invite(dto, { id: actor.id, email: actor.email });
  }

  @Public()
  @Post("setup")
  @HttpCode(HttpStatus.CREATED)
  async setup(@Body() dto: SetupDto): Promise<void> {
    await this.authService.setup(dto);
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = await this.authService.login(dto);
    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
    return { ok: true };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: "strict" });
    return { ok: true };
  }

  @Get("me")
  me(@CurrentUser() user: HrUserEntity) {
    return this.authService.me(user);
  }
}
