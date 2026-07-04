import { SalaryComponentEntity } from "../../src/salary/salary-component.entity";
import { SalaryStructureEntity } from "../../src/salary/salary-structure.entity";
import { buildEmployeeInput } from "./employee-factory";
import { persistEmployees } from "./persist-employee";
import { initTestDataSource } from "./test-data-source";

const STRUCT_BATCH = 500;

/**
 * Seed `count` employees, each with one active salary structure.
 * Employees are inserted first via persistEmployees, then structures are bulk-
 * inserted in batches directly against the test datasource.
 */
export async function persistPayrollSeed(
  count: number,
  effectiveFrom = "2024-01-01",
): Promise<void> {
  await persistEmployees(count, (i) => buildEmployeeInput({ employeeCode: `SCALE-${String(i).padStart(6, "0")}` }));

  const ds = await initTestDataSource();
  const structRepo = ds.getRepository(SalaryStructureEntity);
  const compRepo = ds.getRepository(SalaryComponentEntity);

  // Fetch all employee IDs we just inserted (the SCALE-* ones)
  const rows: { id: string; currency: string }[] = await ds.query(
    `SELECT id, currency FROM employees WHERE employee_code LIKE 'SCALE-%' ORDER BY created_at`,
  );

  for (let i = 0; i < rows.length; i += STRUCT_BATCH) {
    const batch = rows.slice(i, i + STRUCT_BATCH);

    const structs = batch.map((emp) =>
      structRepo.create({
        employeeId: emp.id,
        effectiveFrom,
        effectiveTo: null,
        currency: emp.currency,
      }),
    );
    const savedStructs = await structRepo.insert(structs);

    const components: Partial<SalaryComponentEntity>[] = [];
    for (let j = 0; j < batch.length; j++) {
      const structId = savedStructs.identifiers[j].id as string;
      components.push(
        compRepo.create({ structureId: structId, code: "BASIC", kind: "EARNING", amountMinor: 500_000 }),
        compRepo.create({ structureId: structId, code: "HRA", kind: "EARNING", amountMinor: 100_000 }),
        compRepo.create({ structureId: structId, code: "PF", kind: "DEDUCTION", amountMinor: 60_000 }),
      );
    }

    for (let k = 0; k < components.length; k += STRUCT_BATCH * 3) {
      await compRepo.insert(components.slice(k, k + STRUCT_BATCH * 3));
    }
  }
}
