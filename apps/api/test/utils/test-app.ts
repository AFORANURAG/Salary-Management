import { type INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require("cookie-parser") as typeof import("cookie-parser");
import { AppModule } from "../../src/app.module";
import { MulterExceptionFilter } from "../../src/common/multer-exception.filter";
import { persistActiveAdmin } from "./hr-user-factory";

/**
 * Boot the full Nest application against the test database, configured the same
 * way as production (global validation pipe + cookie-parser). Callers must `close()` when done.
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.use(cookieParser());
  app.setGlobalPrefix("v1", { exclude: ["health"] });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new MulterExceptionFilter());
  await app.init();
  return app;
}

/**
 * Create a test admin, login, and return the Set-Cookie header string array.
 * Use this in beforeAll/beforeEach to get an auth cookie for existing test suites.
 */
export async function loginAsAdmin(app: INestApplication): Promise<string[]> {
  const email = `admin-${Date.now()}@acme-test.example.com`;
  await persistActiveAdmin({ email });
  const res = await request(app.getHttpServer())
    .post("/v1/auth/login")
    .send({ email, password: "Test1234!" });
  return res.headers["set-cookie"] as unknown as string[];
}
