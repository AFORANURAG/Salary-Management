"use client";

import { usePayrollRuns } from "@salary-mgmt/store";
import { PayrollRunList } from "../components/payroll-run-list";

export default function PayrollHistoryPage() {
  const { data: runs = [], isLoading } = usePayrollRuns();

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Payroll History</h1>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading…</div>
      ) : (
        <PayrollRunList runs={runs} />
      )}
    </div>
  );
}
