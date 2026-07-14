import "dotenv/config";
import { faker } from "@faker-js/faker";
import { DEPARTMENTS, type Department } from "@salary-mgmt/types";
import * as bcrypt from "bcrypt";
import { AppDataSource } from "./data-source";
import { EmployeeEntity } from "../employees/employee.entity";
import { HrUserEntity } from "../hr-users/hr-user.entity";
import { SalaryStructureEntity } from "../salary/salary-structure.entity";
import { SalaryComponentEntity } from "../salary/salary-component.entity";
import { PayrollRunEntity } from "../payroll/payroll-run.entity";
import { PayrollResultEntity } from "../payroll/payroll-result.entity";
import type { ComponentKind, EmploymentStatus } from "@salary-mgmt/types";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const TARGET_EMPLOYEES = 10_000;
const EMP_CHUNK = 500;
const STRUCT_CHUNK = 500;
const COMP_CHUNK = 2_000;
const PAYROLL_CHUNK = 500;

// 3 completed payroll runs for the most recent full months
const PAYROLL_PERIODS = ["2026-04", "2026-05", "2026-06"];

const STATUSES: EmploymentStatus[] = ["ACTIVE", "ACTIVE", "ACTIVE", "INACTIVE", "TERMINATED"];

// ---------------------------------------------------------------------------
// Designation hierarchy per department
// Index = seniority level (0 = entry, higher = senior)
// ---------------------------------------------------------------------------

const DEPT_DESIGNATIONS: Record<Department, string[]> = {
  Engineering: [
    "Software Engineer",
    "Senior Software Engineer",
    "Staff Engineer",
    "Tech Lead",
    "Engineering Manager",
    "VP Engineering",
  ],
  Sales: [
    "Sales Executive",
    "Senior Sales Executive",
    "Sales Manager",
    "Regional Sales Manager",
    "VP Sales",
  ],
  Finance: [
    "Finance Analyst",
    "Senior Finance Analyst",
    "Finance Manager",
    "Senior Finance Manager",
    "VP Finance",
  ],
  HR: [
    "HR Executive",
    "Senior HR Executive",
    "HR Manager",
    "HR Business Partner",
    "HR Director",
  ],
  Operations: [
    "Operations Executive",
    "Senior Operations Executive",
    "Operations Manager",
    "Senior Operations Manager",
    "VP Operations",
  ],
};

// Monthly gross CTC ranges in rupees, by seniority level
const MONTHLY_BANDS = [
  { min: 25_000, max: 50_000 },    // L0 — entry
  { min: 50_000, max: 90_000 },    // L1 — junior
  { min: 90_000, max: 160_000 },   // L2 — mid
  { min: 160_000, max: 280_000 },  // L3 — senior
  { min: 280_000, max: 450_000 },  // L4 — lead / manager
  { min: 450_000, max: 700_000 },  // L5 — VP / director
];

// Org pyramid: weight toward lower levels (more ICs than managers)
const LEVEL_WEIGHTS = [35, 25, 20, 12, 6, 2];

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function pickLevel(numLevels: number): number {
  const weights = LEVEL_WEIGHTS.slice(0, numLevels);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = faker.number.int({ min: 1, max: total });
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return i;
  }
  return numLevels - 1;
}

function monthlyCtcRupees(level: number): number {
  const band = MONTHLY_BANDS[Math.min(level, MONTHLY_BANDS.length - 1)]!;
  return faker.number.int({ min: band.min, max: band.max });
}

/**
 * Build 5 salary component rows for a structure.
 *
 * Component breakdown (Indian payroll norms):
 *   BASIC          = 40% of monthly CTC  (EARNING)
 *   HRA            = 20% of monthly CTC  (EARNING) — 50% of Basic, standard
 *   FOOD_ALLOWANCE = ₹2,200 flat          (EARNING) — tax-exempt coupon limit
 *   PROFESSIONAL_TAX = ₹200 flat          (DEDUCTION) — statutory (KA/MH/etc.)
 *   TDS            = 10% of Basic         (DEDUCTION) — simplified income-tax withholding
 *
 * gross  = BASIC + HRA + FOOD_ALLOWANCE
 * net    = gross - PROFESSIONAL_TAX - TDS
 */
function buildComponentValues(
  structureId: string,
  ctcRupees: number,
): { structureId: string; code: string; kind: ComponentKind; amountMinor: number }[] {
  const basic = Math.round(ctcRupees * 0.40);
  const hra = Math.round(ctcRupees * 0.20);
  const food = 2_200;
  const profTax = 200;
  const tds = Math.round(basic * 0.10);

  return [
    { structureId, code: "BASIC", kind: "EARNING", amountMinor: basic * 100 },
    { structureId, code: "HRA", kind: "EARNING", amountMinor: hra * 100 },
    { structureId, code: "FOOD_ALLOWANCE", kind: "EARNING", amountMinor: food * 100 },
    { structureId, code: "PROFESSIONAL_TAX", kind: "DEDUCTION", amountMinor: profTax * 100 },
    { structureId, code: "TDS", kind: "DEDUCTION", amountMinor: tds * 100 },
  ];
}

function computePayroll(
  components: { kind: ComponentKind; amountMinor: number }[],
): { grossMinor: number; deductionsMinor: number; netMinor: number } {
  let grossMinor = 0;
  let deductionsMinor = 0;
  for (const c of components) {
    if (c.kind === "EARNING") grossMinor += c.amountMinor;
    else deductionsMinor += c.amountMinor;
  }
  return { grossMinor, deductionsMinor, netMinor: grossMinor - deductionsMinor };
}

function resolvePeriodStructure<T extends { effectiveFrom: string; effectiveTo: string | null }>(
  versions: T[],
  period: string,
): T | null {
  const periodStart = `${period}-01`;
  return (
    versions.find(
      (v) =>
        v.effectiveFrom <= periodStart &&
        (v.effectiveTo === null || v.effectiveTo >= periodStart),
    ) ?? null
  );
}

// ---------------------------------------------------------------------------
// Seed functions
// ---------------------------------------------------------------------------

function buildEmployee(index: number): Partial<EmployeeEntity> {
  const department = faker.helpers.arrayElement([...DEPARTMENTS]) as Department;
  const designations = DEPT_DESIGNATIONS[department];
  const level = pickLevel(designations.length);
  const deptPrefix = department.slice(0, 3).toUpperCase();
  return {
    employeeCode: `EMP-${String(index).padStart(6, "0")}`,
    name: faker.person.fullName(),
    email: `emp${index}@acme-seed.example.com`,
    department,
    designation: designations[level]!,
    country: "IN",
    currency: "INR",
    joiningDate: faker.date.past({ years: 10 }).toISOString().slice(0, 10),
    employmentStatus: faker.helpers.arrayElement(STATUSES),
    costCenter: faker.datatype.boolean(0.4)
      ? `CC-${deptPrefix}-${faker.number.int({ min: 1, max: 20 }).toString().padStart(3, "0")}`
      : null,
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

async function seedEmployees(): Promise<EmployeeEntity[]> {
  const repo = AppDataSource.getRepository(EmployeeEntity);
  const existing = await repo.count();

  if (existing >= TARGET_EMPLOYEES) {
    console.log(`Employee seed skipped — ${existing} already present.`);
    return repo.find();
  }

  const toInsert = TARGET_EMPLOYEES - existing;
  console.log(`Seeding ${toInsert} employees in chunks of ${EMP_CHUNK}…`);

  let inserted = 0;
  let index = existing + 1;

  while (inserted < toInsert) {
    const size = Math.min(EMP_CHUNK, toInsert - inserted);
    const batch = Array.from({ length: size }, () => buildEmployee(index++));
    await repo.insert(batch);
    inserted += size;
    process.stdout.write(`\r  ${inserted}/${toInsert}`);
  }

  console.log(`\nEmployees done — ${await repo.count()} total.`);
  return repo.find();
}

async function seedSalaryStructures(employees: EmployeeEntity[]): Promise<void> {
  const structureRepo = AppDataSource.getRepository(SalaryStructureEntity);
  const componentRepo = AppDataSource.getRepository(SalaryComponentEntity);

  const existingCount = await structureRepo.count();
  if (existingCount > 0) {
    console.log(`\nSalary structure seed skipped — ${existingCount} already present.`);
    return;
  }

  console.log(`\nSeeding salary structures for ${employees.length} employees…`);

  const allComponents: {
    structureId: string;
    code: string;
    kind: ComponentKind;
    amountMinor: number;
  }[] = [];

  // Insert structures in batches; collect component rows as we go
  for (let i = 0; i < employees.length; i += STRUCT_CHUNK) {
    const batch = employees.slice(i, i + STRUCT_CHUNK);

    const structValues = batch.map((emp) => ({
      employeeId: emp.id,
      effectiveFrom: emp.joiningDate,
      effectiveTo: null as string | null,
      currency: "INR",
    }));

    const result = await structureRepo
      .createQueryBuilder()
      .insert()
      .into(SalaryStructureEntity)
      .values(structValues)
      .execute();

    for (let j = 0; j < batch.length; j++) {
      const emp = batch[j]!;
      const structureId = (result.identifiers[j] as { id: string }).id;
      const dept = emp.department as Department;
      const level = DEPT_DESIGNATIONS[dept].indexOf(emp.designation);
      const ctc = monthlyCtcRupees(level >= 0 ? level : 0);
      allComponents.push(...buildComponentValues(structureId, ctc));
    }

    process.stdout.write(`\r  ${Math.min(i + STRUCT_CHUNK, employees.length)}/${employees.length}`);
  }

  console.log(`\nInserting ${allComponents.length} salary components…`);
  for (let i = 0; i < allComponents.length; i += COMP_CHUNK) {
    await componentRepo
      .createQueryBuilder()
      .insert()
      .into(SalaryComponentEntity)
      .values(allComponents.slice(i, i + COMP_CHUNK))
      .execute();
    process.stdout.write(`\r  ${Math.min(i + COMP_CHUNK, allComponents.length)}/${allComponents.length}`);
  }

  console.log(`\nSalary structures done.`);
}

async function seedPayrollRuns(): Promise<void> {
  const runRepo = AppDataSource.getRepository(PayrollRunEntity);
  const resultRepo = AppDataSource.getRepository(PayrollResultEntity);
  const employeeRepo = AppDataSource.getRepository(EmployeeEntity);
  const structureRepo = AppDataSource.getRepository(SalaryStructureEntity);

  // Load once; reused across all periods
  const employees = await employeeRepo.find();
  const structures = await structureRepo.find({ relations: ["components"] });

  const byEmployee = new Map<string, SalaryStructureEntity[]>();
  for (const s of structures) {
    const list = byEmployee.get(s.employeeId) ?? [];
    list.push(s);
    byEmployee.set(s.employeeId, list);
  }

  for (const period of PAYROLL_PERIODS) {
    const existing = await runRepo.findOne({ where: { period } });
    if (existing) {
      console.log(`\nPayroll run ${period} already exists — skipping.`);
      continue;
    }

    type ResultRow = {
      employeeId: string;
      period: string;
      structureId: string;
      grossMinor: number;
      deductionsMinor: number;
      netMinor: number;
      currency: string;
    };

    const results: ResultRow[] = [];

    for (const emp of employees) {
      const versions = byEmployee.get(emp.id) ?? [];
      const activeStructure = resolvePeriodStructure(versions, period);
      if (!activeStructure) continue;

      const { grossMinor, deductionsMinor, netMinor } = computePayroll(
        activeStructure.components,
      );
      results.push({
        employeeId: emp.id,
        period,
        structureId: activeStructure.id,
        grossMinor,
        deductionsMinor,
        netMinor,
        currency: activeStructure.currency,
      });
    }

    console.log(`\nInserting ${results.length} payroll results for ${period}…`);
    for (let i = 0; i < results.length; i += PAYROLL_CHUNK) {
      await resultRepo
        .createQueryBuilder()
        .insert()
        .into(PayrollResultEntity)
        .values(results.slice(i, i + PAYROLL_CHUNK))
        .orIgnore()
        .execute();
      process.stdout.write(`\r  ${Math.min(i + PAYROLL_CHUNK, results.length)}/${results.length}`);
    }

    const totalGross = results.reduce((s, r) => s + r.grossMinor, 0);
    const totalDeductions = results.reduce((s, r) => s + r.deductionsMinor, 0);
    const totalNet = results.reduce((s, r) => s + r.netMinor, 0);

    // ranAt = 1st of the following month (JS months are 0-indexed; period month is 1-indexed)
    const [yearStr, monthStr] = period.split("-");
    const ranAt = new Date(Number(yearStr), Number(monthStr), 1);

    await runRepo.save(
      runRepo.create({
        period,
        status: "COMPLETED",
        headcount: results.length,
        totalGrossMinor: totalGross,
        totalDeductionsMinor: totalDeductions,
        totalNetMinor: totalNet,
        currency: "INR",
        ranAt,
      }),
    );

    const netCr = (totalNet / 100 / 1_00_000).toFixed(2);
    console.log(`\n  ${period} — ${results.length} employees processed, net ₹${netCr} Cr`);
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function seed(): Promise<void> {
  await AppDataSource.initialize();
  await seedAdmin();
  const employees = await seedEmployees();
  await seedSalaryStructures(employees);
  console.log("\nLoading structures for payroll seed…");
  await seedPayrollRuns();
  console.log("\nAll seed complete.");
  await AppDataSource.destroy();
}

seed().catch((err: unknown) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
