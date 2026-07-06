import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import type { HrUserEntity } from "../hr-users/hr-user.entity";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): HrUserEntity => {
    const request = ctx.switchToHttp().getRequest<Request & { user: HrUserEntity }>();
    return request.user;
  },
);
