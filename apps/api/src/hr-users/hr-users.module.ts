import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HrUserEntity } from "./hr-user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([HrUserEntity])],
  exports: [TypeOrmModule],
})
export class HrUsersModule {}
