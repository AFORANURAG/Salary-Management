"use client";

import { useState } from "react";
import { usePayrollRuns } from "@salary-mgmt/store";
import { Button } from "@salary-mgmt/ui";
import { PayrollRunList } from "./components/payroll-run-list";
import { RunPayrollDialog } from "./components/run-payroll-dialog";
import type { PayrollRunSummary } from "@salary-mgmt/types";

export default function PayrollPage() {
  const { data: runs = [], isLoading } = usePayrollRuns();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [recentRuns, setRecentRuns] = useState<PayrollRunSummary[]>([]);

  const allRuns = [...recentRuns, ...runs.filter((r) => !recentRuns.find((rr) => rr.period === r.period))];

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Payroll</h1>
        <Button onClick={() => setDialogOpen(true)}>Run Payroll</Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading…</div>
      ) : (
        <PayrollRunList runs={allRuns} />
      )}

      <RunPayrollDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={(summary) => setRecentRuns((prev) => [summary, ...prev.filter((r) => r.period !== summary.period)])}
      />
    </div>
  );
}
