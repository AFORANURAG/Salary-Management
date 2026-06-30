import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST ?? "localhost",
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER ?? "salary",
      password: process.env.DB_PASSWORD ?? "salary",
      database: process.env.DB_NAME ?? "salary_mgmt",
      autoLoadEntities: true,
      synchronize: false,
      migrations: ["dist/database/migrations/*.js"],
      migrationsRun: false,
    }),
  ],
})
export class DatabaseModule {}
