import "dotenv/config";
import { faker } from "@faker-js/faker";
import { DEPARTMENTS, type Department } from "@salary-mgmt/types";
import * as bcrypt from "bcrypt";
import { AppDataSource } from "./data-source";
import { EmployeeEntity } from "../employees/employee.entity";
import { HrUserEntity } from "../hr-users/hr-user.entity";
import type { EmploymentStatus } from "@salary-mgmt/types";

const COUNTRIES = ["US", "IN", "GB", "DE", "SG", "AU", "CA", "FR", "JP", "BR"] as const;
const CURRENCIES = ["USD", "INR", "GBP", "EUR", "SGD", "AUD", "CAD", "EUR", "JPY", "BRL"] as const;
const STATUSES: EmploymentStatus[] = ["ACTIVE", "ACTIVE", "ACTIVE", "INACTIVE", "TERMINATED"];

const TARGET = 10_000;
const CHUNK = 500;

function buildEmployee(index: number): Partial<EmployeeEntity> {
  const countryIdx = faker.number.int({ min: 0, max: COUNTRIES.length - 1 });
  return {
    employeeCode: `EMP-${String(index).padStart(6, "0")}`,
    name: faker.person.fullName(),
    email: `emp${index}@acme-seed.example.com`,
    department: faker.helpers.arrayElement([...DEPARTMENTS]) as Department,
    designation: faker.person.jobTitle(),
    country: COUNTRIES[countryIdx],
    currency: CURRENCIES[countryIdx],
    joiningDate: faker.date.past({ years: 10 }).toISOString().slice(0, 10),
    employmentStatus: faker.helpers.arrayElement(STATUSES),
    costCenter: faker.datatype.boolean(0.4) ? `CC-${faker.number.int({ min: 100, max: 999 })}` : null,
  };
}

async function seedAdmin(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("Skipping admin seed — SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD not set.");
    return;
  }
  const repo = AppDataSource.getRepository(HrUserEntity);
  const existing = await repo.findOne({ where: { email } });
  if (existing) {
    console.log(`Admin ${email} already exists — skipping.`);
    return;
  }
  const rounds = Number(process.env.BCRYPT_ROUNDS ?? 12);
  const passwordHash = await bcrypt.hash(password, rounds);
  await repo.save(
    repo.create({ email, name: "Admin", role: "ADMIN", passwordHash, status: "ACTIVE" }),
  );
  console.log(`Admin ${email} created.`);
}

async function seed(): Promise<void> {
  await AppDataSource.initialize();
  await seedAdmin();
  const repo = AppDataSource.getRepository(EmployeeEntity);

  const existing = await repo.count();
  if (existing >= TARGET) {
    console.log(`Seed skipped — ${existing} employees already present.`);
    await AppDataSource.destroy();
    return;
  }

  const toInsert = TARGET - existing;
  console.log(`Seeding ${toInsert} employees in chunks of ${CHUNK}…`);

  let inserted = 0;
  let index = existing + 1;

  while (inserted < toInsert) {
    const size = Math.min(CHUNK, toInsert - inserted);
    const batch = Array.from({ length: size }, () => buildEmployee(index++));
    await repo.insert(batch);
    inserted += size;
    process.stdout.write(`\r  ${inserted}/${toInsert}`);
  }

  console.log(`\nSeed complete — ${await repo.count()} total employees.`);
  await AppDataSource.destroy();
}

seed().catch((err: unknown) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
