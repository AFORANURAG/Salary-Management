"use client";

import { useParams, useRouter } from "next/navigation";
import { usePayrollSummary } from "@salary-mgmt/store";
import { Button } from "@salary-mgmt/ui";
import { PayrollSummaryCard } from "./components/payroll-summary-card";
import { PayrollResultsTable } from "./components/payroll-results-table";

export default function PayrollDetailPage() {
  const { period } = useParams<{ period: string }>();
  const router = useRouter();
  const { data: summary, isLoading, isError } = usePayrollSummary(period);

  if (isError) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <p className="text-destructive text-sm">No payroll run found for {period}.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payroll Run</h1>
          <p className="text-muted-foreground text-sm">{period}</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>

      <PayrollSummaryCard summary={summary} isLoading={isLoading} />

      {!isLoading && <PayrollResultsTable period={period} />}
    </div>
  );
}
