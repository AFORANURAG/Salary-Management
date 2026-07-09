"use client";

import { useState } from "react";
import { usePayrollRuns } from "@salary-mgmt/store";
import { Button } from "@salary-mgmt/ui";
import { PayrollRunList } from "./components/payroll-run-list";
import { RunPayrollDialog } from "./components/run-payroll-dialog";
import type { PayrollRunStatus } from "@salary-mgmt/types";

export default function PayrollPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<PayrollRunStatus | undefined>(undefined);

  const { data, isLoading } = usePayrollRuns(
    statusFilter ? { status: statusFilter } : undefined,
  );

  const runs = data?.data ? [...data.data] : [];

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Payroll</h1>
        <Button onClick={() => setDialogOpen(true)}>Run Payroll</Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading…</div>
      ) : (
        <PayrollRunList
          runs={runs}
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
        />
      )}

      <RunPayrollDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
