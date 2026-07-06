import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { HrUserRole } from "@salary-mgmt/types";
import type { Request } from "express";
import type { HrUserEntity } from "../hr-users/hr-user.entity";
import { ROLES_KEY } from "./roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<HrUserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest<Request & { user?: HrUserEntity }>();
    const user = req.user;
    if (!user) throw new ForbiddenException();

    if (!required.includes(user.role)) throw new ForbiddenException();
    return true;
  }
}
