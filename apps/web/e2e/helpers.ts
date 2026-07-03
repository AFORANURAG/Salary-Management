const API = "http://localhost:3001/v1";

export interface EmployeeFixture {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  department: string;
}

let _seq = 0;

function seq(): string {
  _seq += 1;
  return String(_seq).padStart(4, "0");
}

export async function createEmployee(
  overrides: Partial<{
    employeeCode: string;
    name: string;
    email: string;
    department: string;
  }> = {}
): Promise<EmployeeFixture> {
  const s = seq();
  const body = {
    employeeCode: overrides.employeeCode ?? `E2E-${s}`,
    name: overrides.name ?? `E2E Employee ${s}`,
    email: overrides.email ?? `e2e-${s}@example.com`,
    department: overrides.department ?? "Engineering",
    designation: "Engineer",
    country: "IN",
    currency: "INR",
    joiningDate: "2024-01-01",
    employmentStatus: "ACTIVE",
  };

  const res = await fetch(`${API}/employees`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`createEmployee failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return {
    id: data.id,
    employeeCode: data.employeeCode,
    name: data.name,
    email: data.email,
    department: data.department,
  };
}

export async function deleteEmployee(id: string): Promise<void> {
  await fetch(`${API}/employees/${id}`, { method: "DELETE" });
}
