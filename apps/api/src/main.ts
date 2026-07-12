import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require("cookie-parser") as typeof import("cookie-parser");
import { AppModule } from "./app.module";
import { MulterExceptionFilter } from "./common/multer-exception.filter";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.setGlobalPrefix("v1", { exclude: ["health"] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new MulterExceptionFilter());
  app.enableCors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:3000", credentials: true });
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
}

void bootstrap();
