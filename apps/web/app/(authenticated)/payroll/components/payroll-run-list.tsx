"use client";

import type { PayrollRunSummary } from "@salary-mgmt/types";
import { formatMinor } from "@salary-mgmt/money";
import Link from "next/link";

interface PayrollRunListProps {
  runs: PayrollRunSummary[];
}

export function PayrollRunList({ runs }: PayrollRunListProps) {
  if (runs.length === 0) {
    return (
      <div
        data-testid="payroll-run-list-empty"
        className="text-muted-foreground rounded-md border border-dashed p-8 text-center text-sm"
      >
        No payroll runs yet. Click &ldquo;Run Payroll&rdquo; to generate the first one.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-2 text-left font-medium">Period</th>
            <th className="px-4 py-2 text-right font-medium">Processed</th>
            <th className="px-4 py-2 text-right font-medium">Total Gross</th>
            <th className="px-4 py-2 text-right font-medium">Total Net</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.period} className="border-t hover:bg-muted/30">
              <td className="px-4 py-2">
                <Link
                  href={`/payroll/${run.period}`}
                  className="text-primary font-medium underline-offset-2 hover:underline"
                >
                  {run.period}
                </Link>
              </td>
              <td className="px-4 py-2 text-right">{run.processed}</td>
              <td className="px-4 py-2 text-right">
                {formatMinor(run.totalGrossMinor, "USD")}
              </td>
              <td className="px-4 py-2 text-right">
                {formatMinor(run.totalNetMinor, "USD")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
