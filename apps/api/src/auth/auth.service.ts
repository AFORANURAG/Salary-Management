import {
  ConflictException,
  GoneException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import type { HrUserRole } from "@salary-mgmt/types";
import * as bcrypt from "bcrypt";
import { Repository } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { HrUserEntity } from "../hr-users/hr-user.entity";

const INVITE_TTL_MS = 72 * 60 * 60 * 1000;
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 12);

export interface JwtPayload {
  sub: string;
  email: string;
  role: HrUserRole;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(HrUserEntity)
    private readonly hrUsers: Repository<HrUserEntity>,
    private readonly jwt: JwtService,
  ) {}

  async invite(
    input: { email: string; name: string; role: HrUserRole },
    actor: { id: string; email: string },
  ): Promise<{ inviteToken: string; inviteUrl: string }> {
    void actor;
    const existing = await this.hrUsers.findOne({ where: { email: input.email } });
    if (existing) {
      throw new ConflictException(`Email ${input.email} is already registered`);
    }

    const inviteToken = uuidv4();
    const inviteExpiresAt = new Date(Date.now() + INVITE_TTL_MS);

    const user = this.hrUsers.create({
      email: input.email,
      name: input.name,
      role: input.role,
      status: "PENDING_SETUP",
      inviteToken,
      inviteExpiresAt,
      passwordHash: null,
    });
    await this.hrUsers.save(user);

    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
    return {
      inviteToken,
      inviteUrl: `${frontendUrl}/auth/setup?token=${inviteToken}`,
    };
  }

  async setup(input: { token: string; name: string; password: string }): Promise<void> {
    const user = await this.hrUsers.findOne({
      where: { inviteToken: input.token },
    });

    if (!user || !user.inviteExpiresAt || user.inviteExpiresAt < new Date()) {
      throw new GoneException("Invite token is invalid or has expired");
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    user.name = input.name;
    user.passwordHash = passwordHash;
    user.status = "ACTIVE";
    user.inviteToken = null;
    user.inviteExpiresAt = null;
    await this.hrUsers.save(user);
  }

  async login(input: { email: string; password: string }): Promise<string> {
    const user = await this.hrUsers.findOne({ where: { email: input.email } });

    if (!user || user.status !== "ACTIVE" || !user.passwordHash) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const match = await bcrypt.compare(input.password, user.passwordHash);
    if (!match) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    return this.jwt.sign(payload);
  }

  async validateById(id: string): Promise<HrUserEntity> {
    const user = await this.hrUsers.findOne({ where: { id } });
    if (!user || user.status !== "ACTIVE") {
      throw new UnauthorizedException();
    }
    return user;
  }

  me(user: HrUserEntity): { id: string; email: string; name: string; role: HrUserRole } {
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }
}
