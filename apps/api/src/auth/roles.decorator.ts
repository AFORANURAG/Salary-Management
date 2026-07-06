import { SetMetadata } from "@nestjs/common";
import type { HrUserRole } from "@salary-mgmt/types";

export const ROLES_KEY = "roles";
export const Roles = (...roles: HrUserRole[]) => SetMetadata(ROLES_KEY, roles);
