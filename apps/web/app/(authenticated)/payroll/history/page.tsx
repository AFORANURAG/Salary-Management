"use client";

import { useState } from "react";
import { usePayrollRuns } from "@salary-mgmt/store";
import { PayrollRunList } from "../components/payroll-run-list";
import type { PayrollRunStatus } from "@salary-mgmt/types";

export default function PayrollHistoryPage() {
  const [statusFilter, setStatusFilter] = useState<PayrollRunStatus | undefined>(undefined);
  const { data, isLoading } = usePayrollRuns(
    statusFilter ? { status: statusFilter } : undefined,
  );
  const runs = data?.data ?? [];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Payroll History</h1>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading…</div>
      ) : (
        <PayrollRunList
          runs={[...runs]}
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
        />
      )}
    </div>
  );
}
