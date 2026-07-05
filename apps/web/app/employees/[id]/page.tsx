"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useEmployee } from "@salary-mgmt/store";
import { Badge, Button, Skeleton } from "@salary-mgmt/ui";
import { SalaryStructureCard } from "./components/salary-structure-card";
import { SalaryStructureHistory } from "./components/salary-structure-history";
import { UpsertSalaryStructureDialog } from "./components/upsert-salary-structure-dialog";
import { PayslipHistoryList } from "./components/payslip-history-list";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  ACTIVE: "default",
  INACTIVE: "secondary",
  TERMINATED: "destructive",
};

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-muted-foreground text-sm font-medium">{label}</dt>
      <dd className="mt-1 text-sm">{value ?? "—"}</dd>
    </div>
  );
}

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: employee, isLoading, isError } = useEmployee(id);
  const [upsertOpen, setUpsertOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded" />
        ))}
      </div>
    );
  }

  if (isError || !employee) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-destructive text-sm">Employee not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{employee.name}</h1>
          <p className="text-muted-foreground text-sm">{employee.employeeCode}</p>
        </div>
        <Badge variant={STATUS_VARIANT[employee.employmentStatus] ?? "secondary"}>
          {employee.employmentStatus}
        </Badge>
      </div>

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Email" value={employee.email} />
        <Field label="Department" value={employee.department} />
        <Field label="Designation" value={employee.designation} />
        <Field label="Country" value={employee.country} />
        <Field label="Currency" value={employee.currency} />
        <Field label="Joining Date" value={employee.joiningDate} />
        <Field label="Cost Center" value={employee.costCenter} />
      </dl>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Salary Structure</h2>
          <Button size="sm" onClick={() => setUpsertOpen(true)}>
            Set Salary Structure
          </Button>
        </div>
        <SalaryStructureCard employeeId={id} onSetStructure={() => setUpsertOpen(true)} />
        <SalaryStructureHistory employeeId={id} />
      </div>

      <div className="space-y-2">
        <h2 className="text-base font-semibold">Payslips</h2>
        <PayslipHistoryList employeeId={id} />
      </div>

      <UpsertSalaryStructureDialog
        employeeId={id}
        open={upsertOpen}
        onOpenChange={setUpsertOpen}
      />

      <Button variant="outline" onClick={() => router.back()}>
        Back to employees
      </Button>
    </div>
  );
}
